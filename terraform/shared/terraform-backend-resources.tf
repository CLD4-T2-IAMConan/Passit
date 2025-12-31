# Terraform Backend Resources (S3 + DynamoDB)
# 
# 이 파일은 각 환경(dev, prod)의 Terraform backend를 위한 S3 bucket과 DynamoDB table을 생성합니다.
# 
# 중요:
# - shared 폴더는 로컬 backend를 사용하므로 순환 참조 문제가 없습니다.
# - IAM 권한이 없는 경우: 이미 존재하는 리소스는 terraform import를 사용하세요.
# - 리소스가 없고 권한이 있는 경우: terraform apply로 생성 가능
#
# 사용 순서:
# 1. 리소스가 이미 존재하는 경우:
#    terraform import aws_s3_bucket.terraform_state_dev passit-terraform-state-dev
#    terraform import aws_dynamodb_table.terraform_locks_dev passit-terraform-locks-dev
#    (prod도 동일하게 import)
#
# 2. 리소스가 없는 경우 (IAM 권한 필요):
#    terraform/shared에서 terraform init && terraform apply
#
# 3. 각 환경(dev/prod)에서 S3 backend 설정 후 terraform init -migrate-state

# ============================================
# Dev Environment Backend Resources
# ============================================

# S3 Bucket for Terraform State (Dev)
resource "aws_s3_bucket" "terraform_state_dev" {
  bucket = "passit-terraform-state-dev"

  tags = {
    Name        = "Terraform State Bucket - Dev"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Purpose     = "TerraformBackend"
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
  restrict_public_buckets  = true
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
    Purpose     = "TerraformStateLock"
  }
}

# ============================================
# Prod Environment Backend Resources
# ============================================

# S3 Bucket for Terraform State (Prod)
resource "aws_s3_bucket" "terraform_state_prod" {
  bucket = "passit-terraform-state-prod"

  tags = {
    Name        = "Terraform State Bucket - Prod"
    Environment = "prod"
    ManagedBy   = "Terraform"
    Purpose     = "TerraformBackend"
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
    Purpose     = "TerraformStateLock"
  }
}

