# cicd - github-oidc.tf

################################################
# GitHub OIDC Provider (EKS OIDC랑 다른 Provider)
################################################
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
}

################################################
# IAM Role for GitHub Actions (Frontend Deploy)
################################################
resource "aws_iam_role" "github_actions_frontend" {
  name = "${var.project_name}-${var.environment}-github-actions-frontend"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.deploy_branch}"
          }
        }
      }
    ]
  })
}

############################################
# IAM Policy for Frontend Deploy (ECR로 바뀌면 ECR 권한만 추가)
############################################
resource "aws_iam_policy" "frontend_deploy" {
  name = "${var.project_name}-${var.environment}-frontend-deploy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 업로드
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.frontend_bucket_name}",
          "arn:aws:s3:::${var.frontend_bucket_name}/*"
        ]
      },

      # CloudFront 캐시 무효화
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

############################################
# Policy Attachment
############################################
resource "aws_iam_role_policy_attachment" "frontend_deploy" {
  role       = aws_iam_role.github_actions_frontend.name
  policy_arn = aws_iam_policy.frontend_deploy.arn
}