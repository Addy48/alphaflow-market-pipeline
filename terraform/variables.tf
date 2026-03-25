variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS deployment region."
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
