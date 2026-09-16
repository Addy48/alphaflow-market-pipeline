variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS deployment region."
}

variable "project_name" {
  type        = string
  default     = "alphaflow"
  description = "Project name prefix for resources."
}

variable "bucket_name" {
  type        = string
  default     = "alphaflow-market-data-lake"
  description = "Target S3 bucket for Bronze, Silver, and Gold medallion tiers."
}

variable "glue_database_name" {
  type        = string
  default     = "alphaflow_analytics"
  description = "AWS Glue Database for partitioned gold data."
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment tag."
}

variable "table_name" {
  type        = string
  default     = "alphaflow_factor_state"
  description = "DynamoDB table for serverless factor state tracking and 90-day TTL."
}

variable "sns_topic_name" {
  type        = string
  default     = "alphaflow-factor-alerts"
  description = "SNS topic name for quantitative factor breakout alerts."
}

variable "alert_email" {
  type        = string
  default     = "alerts@aiimin.in"
  description = "Target email address for SNS subscription."
}

variable "lambda_function_name" {
  type        = string
  default     = "alphaflow-serverless-sentinel"
  description = "Name of the serverless alert Lambda function."
}
