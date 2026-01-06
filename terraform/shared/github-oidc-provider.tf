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

# GitHub OIDC Provider ARN
# Provider가 이미 존재하는 경우 (다른 계정에서 생성되었거나 수동으로 생성된 경우)
# ARN을 직접 구성하여 사용
locals {
  github_oidc_provider_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

# Provider를 생성하려고 했지만 "EntityAlreadyExists" 에러 발생
# Provider가 다른 계정에 존재하거나 AWS API 지연 문제일 수 있음
# 
# 해결 방법:
# 1. 기존 Provider를 사용 (현재 설정 - locals에서 ARN 직접 구성)
# 2. Provider를 삭제할 수 있는 권한이 있다면 삭제 후 생성
# 3. 다른 계정의 Provider를 사용해야 한다면 ARN을 하드코딩
#
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