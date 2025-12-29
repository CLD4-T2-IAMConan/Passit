################################################
# GitHub OIDC Provider (EKS OIDC랑 다른 Provider)
################################################
# 이미 존재하는 GitHub OIDC Provider를 data source로 가져옵니다.
# 만약 존재하지 않는다면, 아래 주석을 해제하고 resource로 생성할 수 있습니다.

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# GitHub OIDC Provider가 존재하지 않는 경우에만 사용:
# resource "aws_iam_openid_connect_provider" "github" {
#   url = "https://token.actions.githubusercontent.com"
#
#   client_id_list = [
#     "sts.amazonaws.com"
#   ]
#
#   thumbprint_list = [
#     "6938fd4d98bab03faadb97b34396831e3780aea1"
#   ]
# }