# IAM Role for CI/CD (IRSA)
# - Default: GHCR 사용 (ECR 권한 비활성화)
# - Fallback: ECR 사용 시 주석 해제

resource "aws_iam_policy" "cicd" {
  name = "${var.project_name}-${var.environment}-argocd-irsa"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # =========================
      # 1. ECR permissions (주석 해제 시 사용)
      # =========================
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "ecr:GetAuthorizationToken",
      #     "ecr:BatchCheckLayerAvailability",
      #     "ecr:GetDownloadUrlForLayer",
      #     "ecr:BatchGetImage",
      #     "ecr:PutImage",
      #     "ecr:InitiateLayerUpload",
      #     "ecr:UploadLayerPart",
      #     "ecr:CompleteLayerUpload"
      #   ]
      #   Resource = "*"
      # },

      # =========================
      # 2. S3 permissions (프론트엔드 & 아티팩트 저장)
      # =========================
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject" # 프론트엔드 빌드 시 기존 파일 삭제용
        ]
        Resource = [
          "arn:aws:s3:::${var.frontend_bucket_name}",
          "arn:aws:s3:::${var.frontend_bucket_name}/*"
        ]
      },

      # =========================
      # 3. CloudFront permissions (프론트엔드 캐시 초기화)
      # =========================
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "cicd" {
  name = "${var.project_name}-${var.environment}-argocd-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${var.oidc_provider_url}:sub" = "system:serviceaccount:argocd:argocd-server"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cicd" {
  role       = aws_iam_role.cicd.name
  policy_arn = aws_iam_policy.cicd.arn
}
