################################################
# GitHub OIDC Provider (EKS OIDC랑 다른 Provider)
################################################
# GitHub Actions에서 AWS 리소스에 접근하기 위한 OIDC Provider입니다.
# 
# 주의:
# - 이 Provider는 AWS 계정당 하나만 필요합니다 (모든 환경에서 공유)
# - IAM 권한이 없는 경우: 이미 존재하는 Provider의 ARN을 직접 구성합니다
# - Provider가 없고 권한이 있는 경우: resource로 생성 가능 (주석 해제)
#
# 사용 방법:
# 1. Provider가 이미 존재하는 경우: ARN을 직접 구성하여 사용 (기본값)
# 2. Provider를 생성해야 하는 경우: 아래 resource 주석 해제

data "aws_caller_identity" "current" {}

# GitHub OIDC Provider ARN (이미 존재하는 경우)
# IAM 권한이 없어도 ARN을 직접 구성할 수 있습니다
locals {
  github_oidc_provider_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

# Provider를 생성해야 하는 경우 아래 주석을 해제하세요 (IAM 권한 필요)
# resource "aws_iam_openid_connect_provider" "github" {
#   url = "https://token.actions.githubusercontent.com"
#
#   client_id_list = [
#     "sts.amazonaws.com"
#   ]
#
#   thumbprint_list = [
#     "6938fd4d98bab03faadb97b34396831e3780aea1",
#     "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
#   ]
#
#   tags = {
#     Name        = "GitHub Actions OIDC Provider"
#     Purpose     = "GitHubActions"
#     ManagedBy   = "Terraform"
#   }
# }