# Backend Bootstrap Resources
# S3 bucket and DynamoDB table for Terraform state management
#
# 주의: 이 파일은 backend.tf와 함께 사용할 수 없습니다.
# 부트스트랩 단계:
# 1. backend.tf를 임시로 주석 처리하거나 이름 변경
# 2. terraform init && terraform apply로 S3/DynamoDB 생성
# 3. backend.tf 주석 해제하고 terraform init -migrate-state

# S3 Bucket for Terraform State (Dev)
resource "aws_s3_bucket" "terraform_state_dev" {
  bucket = "passit-terraform-state-dev"

  tags = {
    Name        = "Terraform State Bucket - Dev"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# Enable versioning for state file protection (Dev)
resource "aws_s3_bucket_versioning" "terraform_state_dev" {
  bucket = aws_s3_bucket.terraform_state_dev.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption (Dev)
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_dev" {
  bucket = aws_s3_bucket.terraform_state_dev.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access (Dev)
resource "aws_s3_bucket_public_access_block" "terraform_state_dev" {
  bucket = aws_s3_bucket.terraform_state_dev.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Terraform State (Prod)
resource "aws_s3_bucket" "terraform_state_prod" {
  bucket = "passit-terraform-state-prod"

  tags = {
    Name        = "Terraform State Bucket - Prod"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}

# Enable versioning for state file protection (Prod)
resource "aws_s3_bucket_versioning" "terraform_state_prod" {
  bucket = aws_s3_bucket.terraform_state_prod.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption (Prod)
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_prod" {
  bucket = aws_s3_bucket.terraform_state_prod.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access (Prod)
resource "aws_s3_bucket_public_access_block" "terraform_state_prod" {
  bucket = aws_s3_bucket.terraform_state_prod.id

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
output "s3_bucket_name_dev" {
  value       = aws_s3_bucket.terraform_state_dev.id
  description = "Name of the S3 bucket for Terraform state (dev)"
}

output "s3_bucket_name_prod" {
  value       = aws_s3_bucket.terraform_state_prod.id
  description = "Name of the S3 bucket for Terraform state (prod)"
}

output "dynamodb_table_dev" {
  value       = aws_dynamodb_table.terraform_locks_dev.name
  description = "Name of the DynamoDB table for state locking (dev)"
}

output "dynamodb_table_prod" {
  value       = aws_dynamodb_table.terraform_locks_prod.name
  description = "Name of the DynamoDB table for state locking (prod)"
}

