# cicd - frontend-s3.tf

locals {
  tags = {
    Project = var.project_name
    Env     = var.environment
    Team    = var.team
    Owner   = var.owner
  }

  frontend_bucket = coalesce(
    var.frontend_bucket_name,
    "${var.project_name}-${var.environment}-frontend"
  )
}

resource "aws_s3_bucket" "frontend" {
  count  = var.enable_frontend ? 1 : 0
  bucket = local.frontend_bucket

  # Destroy 시 버킷이 비어있지 않아도 삭제 가능
  force_destroy = true

  tags = local.tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  count  = var.enable_frontend ? 1 : 0
  bucket = aws_s3_bucket.frontend[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  count  = var.enable_frontend ? 1 : 0
  bucket = aws_s3_bucket.frontend[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  count  = var.enable_frontend ? 1 : 0
  bucket = aws_s3_bucket.frontend[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}