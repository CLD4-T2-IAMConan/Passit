# cicd - frontend-cf.tf

resource "aws_cloudfront_origin_access_control" "frontend" {
  count = var.enable_frontend ? 1 : 0

  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for frontend S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"

  # 기존 OAC가 있어도 에러 없이 진행 (import 후 사용)
  lifecycle {
    ignore_changes = all
    # CloudFront Distribution에서 사용 중이면 삭제 방지
    prevent_destroy = true
  }
}

# OAC ID를 사용하는 locals
locals {
  oac_id = var.enable_frontend ? aws_cloudfront_origin_access_control.frontend[0].id : ""
}

resource "aws_cloudfront_distribution" "frontend" {
  count = var.enable_frontend ? 1 : 0

  enabled             = true
  default_root_object = var.frontend_default_root_object
  price_class         = var.frontend_price_class
  aliases             = var.frontend_aliases

  origin {
    domain_name              = aws_s3_bucket.frontend[0].bucket_regional_domain_name
    origin_id                = "s3-frontend-origin"
    origin_access_control_id = local.oac_id
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend-origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  dynamic "custom_error_response" {
    for_each = var.frontend_spa_fallback ? [1] : []
    content {
      error_code            = 404
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.frontend_acm_certificate_arn == null
    acm_certificate_arn            = var.frontend_acm_certificate_arn
    ssl_support_method             = var.frontend_acm_certificate_arn == null ? null : "sni-only"
    minimum_protocol_version       = var.frontend_acm_certificate_arn == null ? "TLSv1.2_2021" : "TLSv1.2_2021"
  }

  tags = {
    Project = var.project_name
    Env     = var.environment
    Team    = var.team
    Owner   = var.owner
  }
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  count = var.enable_frontend ? 1 : 0

  statement {
    sid     = "AllowCloudFrontRead"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = [
      "${aws_s3_bucket.frontend[0].arn}/*"
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend[0].arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  count  = var.enable_frontend ? 1 : 0
  bucket = aws_s3_bucket.frontend[0].id
  policy = data.aws_iam_policy_document.frontend_bucket_policy[0].json
}