# 서비스별 정책 문서

data "aws_iam_policy_document" "backend_service_policy" {
  for_each = toset(var.service_namespaces)

  # =================================================
  # 공통: DB 비번 접근 (account, trade, ticket, chat, cs)
  # =================================================
  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [var.secret_db_password_arn]
  }
 
  # =================================================
  # ElastiCache 인증 토큰 접근 (account, trade, ticket, chat)
  # =================================================
  dynamic "statement" {
    for_each = contains(["account","trade","ticket","chat"], each.key) ? [1] : []
    content {
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [var.secret_elasticache_arn]
    }
  }

  # =================================================
  # account 서비스 전용: 프로필 S3, SMTP, Kakao OAuth
  # =================================================
  dynamic "statement" {
    for_each = each.key == "account" ? [1] : []
    content {
      actions = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ]
      resources = [
        "arn:aws:s3:::${var.s3_bucket_profile}",
        "arn:aws:s3:::${var.s3_bucket_profile}/*"
      ]
    }
  }

  dynamic "statement" {
    for_each = each.key == "account" ? [1] : []
    content {
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [
        var.secret_smtp_arn,
        var.secret_kakao_arn
      ]
    }
  }

  # =================================================
  # ticket 서비스만 ticket S3 접근
  # =================================================
  dynamic "statement" {
    for_each = each.key == "ticket" ? [1] : []
    content {
      actions = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ]
      resources = [
        "arn:aws:s3:::${var.s3_bucket_ticket}",
        "arn:aws:s3:::${var.s3_bucket_ticket}/*"
      ]
    }
  }
}

# =================================================
# 서비스별 IRSA 생성
# =================================================
resource "aws_iam_role" "backend_service" {
  for_each = toset(var.service_namespaces)
  name     = "${var.project_name}-${each.key}-${var.environment}-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Federated = var.oidc_provider_arn }
        Action    = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${var.oidc_provider_url}:sub" = "system:serviceaccount:${each.key}:${each.key}-sa"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "backend_service" {
  for_each = toset(var.service_namespaces)
  name     = "${var.project_name}-${each.key}-${var.environment}-policy"
  role     = aws_iam_role.backend_service[each.key].id
  policy   = data.aws_iam_policy_document.backend_service_policy[each.key].json
}
