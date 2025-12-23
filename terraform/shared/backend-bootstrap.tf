# Backend Bootstrap Resources
# S3 bucket and DynamoDB table for Terraform state management
#
# 주의: 이 파일은 backend.tf와 함께 사용할 수 없습니다.
# 부트스트랩 단계:
# 1. backend.tf를 임시로 주석 처리하거나 이름 변경
# 2. terraform init && terraform apply로 S3/DynamoDB 생성
# 3. backend.tf 주석 해제하고 terraform init -migrate-state

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "passit-terraform-state-bucket"

  tags = {
    Name        = "Terraform State Bucket"
    Environment = "shared"
    ManagedBy   = "Terraform"
  }
}

# Enable versioning for state file protection
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for State Locking (dev environment)
resource "aws_dynamodb_table" "terraform_locks_dev" {
  name         = "passit-terraform-locks-dev"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock Table - Dev"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# DynamoDB Table for State Locking (prod environment)
resource "aws_dynamodb_table" "terraform_locks_prod" {
  name         = "passit-terraform-locks-prod"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock Table - Prod"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}

# Outputs
output "s3_bucket_name" {
  value       = aws_s3_bucket.terraform_state.id
  description = "Name of the S3 bucket for Terraform state"
}

output "dynamodb_table_dev" {
  value       = aws_dynamodb_table.terraform_locks_dev.name
  description = "Name of the DynamoDB table for state locking (dev)"
}

output "dynamodb_table_prod" {
  value       = aws_dynamodb_table.terraform_locks_prod.name
  description = "Name of the DynamoDB table for state locking (prod)"
}
