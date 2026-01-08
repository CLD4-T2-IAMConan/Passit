# S3 Configuration

# S3 Bucket Names Locals
locals {
  s3_bucket_names = {
    for bucket in var.s3_buckets :
    bucket.name => "passit-${var.environment}-${bucket.name}"
  }
}

# ============================================
# S3 Buckets
# ============================================
resource "aws_s3_bucket" "this" {
  for_each = var.create_s3 ? { for bucket in var.s3_buckets : bucket.name => bucket } : {}

  bucket = local.s3_bucket_names[each.key]

  # Destroy 시 버킷이 비어있지 않아도 삭제 가능
  force_destroy = true

  tags = merge(
    local.common_tags,
    {
      Name    = local.s3_bucket_names[each.key]
      Purpose = each.key
    }
  )
}

# ============================================
# S3 Bucket Versioning
# ============================================
resource "aws_s3_bucket_versioning" "this" {
  for_each = var.create_s3 ? { for bucket in var.s3_buckets : bucket.name => bucket } : {}

  bucket = aws_s3_bucket.this[each.key].id

  versioning_configuration {
    status = each.value.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# ============================================
# S3 Bucket Public Access Block
# ============================================
resource "aws_s3_bucket_public_access_block" "this" {
  for_each = var.create_s3 ? { for bucket in var.s3_buckets : bucket.name => bucket } : {}

  bucket = aws_s3_bucket.this[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================
# S3 Bucket Server-Side Encryption
# ============================================
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  for_each = var.create_s3 ? { for bucket in var.s3_buckets : bucket.name => bucket } : {}

  bucket = aws_s3_bucket.this[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.s3_kms_key_id != "" ? "aws:kms" : "AES256"
      kms_master_key_id = var.s3_kms_key_id != "" ? var.s3_kms_key_id : null
    }
    bucket_key_enabled = var.s3_kms_key_id != "" ? true : false
  }
}

# ============================================
# S3 Bucket Lifecycle Configuration
# ============================================
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  for_each = var.create_s3 ? {
    for bucket in var.s3_buckets :
    bucket.name => bucket
    if length(bucket.lifecycle_rules) > 0
  } : {}

  bucket = aws_s3_bucket.this[each.key].id

  dynamic "rule" {
    for_each = each.value.lifecycle_rules

    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      filter {
        prefix = rule.value.prefix != null ? rule.value.prefix : ""
      }

      dynamic "transition" {
        for_each = rule.value.transitions != null ? rule.value.transitions : []
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }
    }
  }
}

# ============================================
# S3 Bucket Policy (count 조건 수정)
# ============================================
resource "aws_s3_bucket_policy" "uploads" {
  count = (var.create_s3 && contains([for b in var.s3_buckets : b.name], "uploads")) ? 1 : 0

  bucket = aws_s3_bucket.this["uploads"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          "${aws_s3_bucket.this["uploads"].arn}",
          "${aws_s3_bucket.this["uploads"].arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "logs" {
  count = (var.create_s3 && contains([for b in var.s3_buckets : b.name], "logs")) ? 1 : 0

  bucket = aws_s3_bucket.this["logs"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          "${aws_s3_bucket.this["logs"].arn}",
          "${aws_s3_bucket.this["logs"].arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "backup" {
  count = (var.create_s3 && contains([for b in var.s3_buckets : b.name], "backup")) ? 1 : 0

  bucket = aws_s3_bucket.this["backup"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          "${aws_s3_bucket.this["backup"].arn}",
          "${aws_s3_bucket.this["backup"].arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}