data "aws_iam_openid_connect_provider" "eks" {
  arn = var.oidc_provider_arn
}

locals {
  oidc_issuer = replace(
    data.aws_iam_openid_connect_provider.eks.url,
    "https://",
    ""
  )
}
