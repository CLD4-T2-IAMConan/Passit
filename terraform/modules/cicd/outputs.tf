# CI/CD Module Outputs

# ===========================================
# GitHub Actions (Frontend Deploy)
# ===========================================
output "github_actions_frontend_role_arn" {
  description = "IAM Role ARN assumed by GitHub Actions for frontend deployment"
  value       = aws_iam_role.github_actions_frontend.arn
}

# ===========================================
# irsa
# ===========================================
output "s3_bucket_profile" {
  description = "Account 서비스 프로필 이미지용 S3 버킷 이름"
  value       = var.s3_bucket_profile
}

output "s3_bucket_ticket" {
  description = "Ticket 서비스 티켓 이미지용 S3 버킷 이름"
  value       = var.s3_bucket_ticket
}

output "secret_db_password_arn" {
  description = "RDS Database 비밀번호 저장용 Secrets Manager ARN"
  value       = var.secret_db_password_arn
}

output "backend_service_irsa_arns" {
  description = "Map of backend service name to IRSA IAM Role ARN"
  value       = { for k, r in aws_iam_role.backend_service : k => r.arn }
}

output "backend_service_sa_names" {
  description = "Map of backend service to ServiceAccount name and namespace"
  value = {
    for k, sa in kubernetes_service_account.backend_service : k => {
      name      = sa.metadata[0].name
      namespace = sa.metadata[0].namespace
    }
  }
}

output "backend_service_policy_arns" {
  description = "Map of backend service name to IAM policy ARN"
  value       = { for k, p in aws_iam_role_policy.backend_service : k => p.arn }
}

# ===========================================
# argocd
# ===========================================
output "argocd_namespace" {
  value = var.argocd_namespace
}

# ===========================================
# frontend bucket
# ===========================================
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

# ===========================================
# ghcr
# ===========================================
output "ghcr_secret_name" {
  value       = var.enable_ghcr_pull_secret ? var.ghcr_secret_name : null
  description = "Kubernetes dockerconfigjson secret name"
}