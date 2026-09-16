terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# =========================================================
# 1. S3 MEDALLION DATA LAKE INFRASTRUCTURE
# =========================================================

resource "aws_s3_bucket" "lake" {
  bucket        = var.bucket_name
  force_destroy = true

  tags = {
    Project     = "AlphaFlow"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "lake_versioning" {
  bucket = aws_s3_bucket.lake.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lake_encryption" {
  bucket = aws_s3_bucket.lake.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ---------------------------------------------------------
# AWS Glue Catalog Database
# ---------------------------------------------------------
resource "aws_glue_catalog_database" "analytics_db" {
  name        = var.glue_database_name
  description = "AlphaFlow institutional market data catalog (Gold tier partitions)"
}

# ---------------------------------------------------------
# AWS Athena Workgroup
# ---------------------------------------------------------
resource "aws_athena_workgroup" "analytics_wg" {
  name        = "alphaflow-analytics-workgroup"
  description = "Workgroup for querying Gold tier market analytics"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.lake.id}/athena-results/"
    }
  }
}

# =========================================================
# 2. EVENT-DRIVEN SERVERLESS FACTOR SENTINEL
# =========================================================

# ---------------------------------------------------------
# DynamoDB State Table (90-Day TTL, PITR Enabled)
# ---------------------------------------------------------
resource "aws_dynamodb_table" "factor_state" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "symbol"
  range_key    = "date"

  attribute {
    name = "symbol"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project     = "AlphaFlow"
    Module      = "ServerlessSentinel"
    Environment = var.environment
  }
}

# ---------------------------------------------------------
# AWS SNS Topic for Breakout Alerts
# ---------------------------------------------------------
resource "aws_sns_topic" "alerts" {
  name = var.sns_topic_name

  tags = {
    Project = "AlphaFlow"
    Module  = "ServerlessSentinel"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---------------------------------------------------------
# Lambda IAM Execution Role & Policy
# ---------------------------------------------------------
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-sentinel-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-sentinel-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.factor_state.arn
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# ---------------------------------------------------------
# Lambda Code Package
# ---------------------------------------------------------
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/lambda.zip"
}

# ---------------------------------------------------------
# Lambda Function
# ---------------------------------------------------------
resource "aws_lambda_function" "sentinel" {
  function_name    = var.lambda_function_name
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  handler          = "serverless_handler.lambda_handler"
  runtime          = "python3.12"
  memory_size      = 256
  timeout          = 60

  environment {
    variables = {
      TABLE_NAME     = aws_dynamodb_table.factor_state.name
      SNS_TOPIC_ARN  = aws_sns_topic.alerts.arn
      RETENTION_DAYS = "90"
    }
  }

  tags = {
    Project     = "AlphaFlow"
    Module      = "ServerlessSentinel"
    Environment = var.environment
  }
}

# ---------------------------------------------------------
# EventBridge Cron Schedule (Post-Market Close Trigger)
# ---------------------------------------------------------
resource "aws_cloudwatch_event_rule" "market_close" {
  name                = "${var.project_name}-market-close-trigger"
  description         = "Triggers AlphaFlow Sentinel 30 minutes after US market close (Monday-Friday)"
  schedule_expression = "cron(30 21 ? * MON-FRI *)"
}

resource "aws_cloudwatch_event_target" "sentinel_target" {
  rule      = aws_cloudwatch_event_rule.market_close.name
  target_id = "AlphaFlowSentinelTarget"
  arn       = aws_lambda_function.sentinel.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sentinel.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.market_close.arn
}
