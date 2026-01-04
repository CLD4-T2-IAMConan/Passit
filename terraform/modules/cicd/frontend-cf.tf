# cicd - frontend-cf.tf

# ALB DNS를 동적으로 가져오기 위한 data source
data "aws_lb" "backend" {
  count = var.enable_frontend && var.alb_name != "" ? 1 : 0
  name  = var.alb_name
}

locals {
  alb_dns_name = var.enable_frontend && var.alb_name != "" ? try(data.aws_lb.backend[0].dns_name, var.alb_dns_name) : var.alb_dns_name
}

# Lambda@Edge: Host 헤더를 동적으로 설정 (origin-request 이벤트)
# Note: Lambda@Edge는 us-east-1 리전에 배포되어야 함
# 현재는 각 서비스별로 다른 Origin을 사용하되, custom_header 없이 설정

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
    # CloudFront Distribution이 먼저 삭제되어야 OAC를 삭제할 수 있음
    # destroy 시에는 prevent_destroy를 false로 설정
    prevent_destroy = false
  }
}

# OAC ID를 사용하는 locals
locals {
  oac_id = var.enable_frontend ? aws_cloudfront_origin_access_control.frontend[0].id : ""
}

resource "aws_cloudfront_distribution" "frontend" {
  count = var.enable_frontend ? 1 : 0

  # ALB가 생성된 후에만 CloudFront Distribution 생성
  # data.aws_lb.backend가 ALB를 찾을 수 있어야 함
  # locals.alb_dns_name을 사용함으로써 자동으로 의존성 생성됨

  enabled             = true
  default_root_object = var.frontend_default_root_object
  price_class         = var.frontend_price_class
  aliases             = var.frontend_aliases

  # S3 Origin (Frontend)
  origin {
    domain_name              = aws_s3_bucket.frontend[0].bucket_regional_domain_name
    origin_id                = "s3-frontend-origin"
    origin_access_control_id = local.oac_id
  }

  # ALB Origin for Account Service
  origin {
    domain_name = local.alb_dns_name != "" ? local.alb_dns_name : ""
    origin_id   = "alb-account-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
    # Note: Host 헤더는 forwarded_values의 headers에 포함되어 전달됨
  }

  # ALB Origin for Ticket Service
  origin {
    domain_name = local.alb_dns_name != "" ? local.alb_dns_name : ""
    origin_id   = "alb-ticket-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }

  # ALB Origin for Trade Service
  origin {
    domain_name = local.alb_dns_name != "" ? local.alb_dns_name : ""
    origin_id   = "alb-trade-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }

  # ALB Origin for Chat Service
  origin {
    domain_name = local.alb_dns_name != "" ? local.alb_dns_name : ""
    origin_id   = "alb-chat-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }

  # ALB Origin for CS Service
  origin {
    domain_name = local.alb_dns_name != "" ? local.alb_dns_name : ""
    origin_id   = "alb-cs-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }

  # Default Behavior: S3 (Frontend)
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

  # Behavior for Account Service API: /api/auth/*, /api/users/* 등
  ordered_cache_behavior {
    path_pattern     = "/api/auth/*"
    target_origin_id = "alb-account-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/api/users/*"
    target_origin_id = "alb-account-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Behavior for Ticket Service API: /api/tickets/*
  ordered_cache_behavior {
    path_pattern     = "/api/tickets/*"
    target_origin_id = "alb-ticket-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Behavior for Trade Service API: /api/trades/*, /api/deals/*
  ordered_cache_behavior {
    path_pattern     = "/api/trades/*"
    target_origin_id = "alb-trade-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/api/deals/*"
    target_origin_id = "alb-trade-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Behavior for Chat Service: /api/chat/*, /ws/*
  ordered_cache_behavior {
    path_pattern     = "/api/chat/*"
    target_origin_id = "alb-chat-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/ws/*"
    target_origin_id = "alb-chat-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Behavior for CS Service: /api/cs/*, /api/notices/*, /api/faqs/*, /api/inquiries/*
  ordered_cache_behavior {
    path_pattern     = "/api/cs/*"
    target_origin_id = "alb-cs-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/api/notices/*"
    target_origin_id = "alb-cs-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/api/faqs/*"
    target_origin_id = "alb-cs-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/api/inquiries/*"
    target_origin_id = "alb-cs-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
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