terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------
# S3 Medallion Data Lake Bucket
# ---------------------------------------------------------
resource "aws_s3_bucket" "lake" {
  bucket        = var.bucket_name
  force_destroy = false

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
