# CI/CD Module Outputs

# ===========================================
# IRSA (EKS / Argo CD)
# ===========================================
output "argocd_irsa_role_arn" {
  description = "IAM Role ARN assumed by Argo CD via IRSA"
  value       = aws_iam_role.cicd.arn
}

# ===========================================
# GitHub Actions (Frontend Deploy)
# ===========================================
output "github_actions_frontend_role_arn" {
  description = "IAM Role ARN assumed by GitHub Actions for frontend deployment"
  value       = aws_iam_role.github_actions_frontend.arn
}

output "github_oidc_provider_arn" {
  description = "GitHub OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.github.arn
}








output "argocd_namespace" {
  value = var.argocd_namespace
}

output "frontend_bucket_name" {
  value       = try(aws_s3_bucket.frontend[0].bucket, null)
  description = "Frontend S3 bucket name"
}

output "frontend_cloudfront_domain" {
  value       = try(aws_cloudfront_distribution.frontend[0].domain_name, null)
  description = "CloudFront domain name"
}

output "frontend_cloudfront_distribution_id" {
  value       = try(aws_cloudfront_distribution.frontend[0].id, null)
  description = "CloudFront distribution id"
}

output "ghcr_secret_name" {
  value       = var.enable_ghcr_pull_secret ? var.ghcr_secret_name : null
  description = "Kubernetes dockerconfigjson secret name"
}