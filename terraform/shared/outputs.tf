output "github_oidc_provider_arn" {
  value       = local.github_oidc_provider_arn
  description = "GitHub Actions OIDC Provider ARN"
}

# ============================================
# Terraform Backend Resources Outputs
# ============================================

output "terraform_backend_s3_bucket_dev" {
  value       = aws_s3_bucket.terraform_state_dev.id
  description = "S3 bucket name for Terraform state (dev environment)"
}

output "terraform_backend_dynamodb_table_dev" {
  value       = aws_dynamodb_table.terraform_locks_dev.name
  description = "DynamoDB table name for Terraform state locking (dev environment)"
}

output "terraform_backend_s3_bucket_prod" {
  value       = aws_s3_bucket.terraform_state_prod.id
  description = "S3 bucket name for Terraform state (prod environment)"
}

output "terraform_backend_dynamodb_table_prod" {
  value       = aws_dynamodb_table.terraform_locks_prod.name
  description = "DynamoDB table name for Terraform state locking (prod environment)"
}
