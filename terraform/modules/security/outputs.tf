# Security Module Outputs

# IAM Roles
output "eks_cluster_role_arn" {
  description = "EKS Cluster IAM Role ARN"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_group_role_arn" {
  description = "EKS Node Group IAM Role ARN"
  value       = aws_iam_role.eks_node_group.arn
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM Role ARN"
  value       = aws_iam_role.github_actions.arn
}

output "argocd_role_arn" {
  description = "ArgoCD IAM Role ARN"
  value       = aws_iam_role.argocd.arn
}

output "prometheus_role_arn" {
  description = "Prometheus IAM Role ARN"
  value       = aws_iam_role.prometheus.arn
}

output "fluentbit_role_arn" {
  description = "Fluent Bit IAM Role ARN"
  value       = aws_iam_role.fluentbit.arn
}

output "app_pod_role_arn" {
  description = "Application Pod IAM Role ARN"
  value       = aws_iam_role.app_pod.arn
}

# KMS Keys
output "secrets_kms_key_id" {
  description = "KMS Key ID for Secrets Manager"
  value       = aws_kms_key.secrets.key_id
}

output "secrets_kms_key_arn" {
  description = "KMS Key ARN for Secrets Manager"
  value       = aws_kms_key.secrets.arn
}

output "rds_kms_key_id" {
  description = "KMS Key ID for RDS"
  value       = aws_kms_key.rds.key_id
}

output "rds_kms_key_arn" {
  description = "KMS Key ARN for RDS"
  value       = aws_kms_key.rds.arn
}

output "elasticache_kms_key_id" {
  description = "KMS Key ID for ElastiCache"
  value       = aws_kms_key.elasticache.key_id
}

output "elasticache_kms_key_arn" {
  description = "KMS Key ARN for ElastiCache"
  value       = aws_kms_key.elasticache.arn
}

output "ebs_kms_key_id" {
  description = "KMS Key ID for EBS volumes"
  value       = aws_kms_key.ebs.key_id
}

output "ebs_kms_key_arn" {
  description = "KMS Key ARN for EBS volumes"
  value       = aws_kms_key.ebs.arn
}

output "s3_kms_key_id" {
  description = "KMS Key ID for S3 buckets"
  value       = aws_kms_key.s3.key_id
}

output "s3_kms_key_arn" {
  description = "KMS Key ARN for S3 buckets"
  value       = aws_kms_key.s3.arn
}

# Secrets Manager
output "db_secret_arn" {
  description = "Database credentials Secret ARN (passit/{env}/db)"
  value       = aws_secretsmanager_secret.db.arn
}

output "db_secret_name" {
  description = "Database credentials Secret name"
  value       = aws_secretsmanager_secret.db.name
}

output "smtp_secret_arn" {
  description = "SMTP email credentials Secret ARN (passit/{env}/smtp)"
  value       = aws_secretsmanager_secret.smtp.arn
}

output "smtp_secret_name" {
  description = "SMTP email credentials Secret name"
  value       = aws_secretsmanager_secret.smtp.name
}

output "kakao_secret_arn" {
  description = "Kakao OAuth credentials Secret ARN (passit/{env}/kakao)"
  value       = aws_secretsmanager_secret.kakao.arn
}

output "kakao_secret_name" {
  description = "Kakao OAuth credentials Secret name"
  value       = aws_secretsmanager_secret.kakao.name
}

output "admin_secret_arn" {
  description = "Admin account credentials Secret ARN (passit/{env}/admin)"
  value       = aws_secretsmanager_secret.admin.arn
}

output "admin_secret_name" {
  description = "Admin account credentials Secret name"
  value       = aws_secretsmanager_secret.admin.name
}

output "app_secret_arn" {
  description = "Application secrets Secret ARN (passit/{env}/app/secrets)"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "app_secret_name" {
  description = "Application secrets Secret name"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "elasticache_secret_arn" {
  description = "ElastiCache credentials Secret ARN"
  value       = aws_secretsmanager_secret.elasticache_credentials.arn
}

output "elasticache_secret_name" {
  description = "ElastiCache credentials Secret name"
  value       = aws_secretsmanager_secret.elasticache_credentials.name
}

# Security Groups
output "alb_security_group_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "eks_worker_security_group_id" {
  description = "EKS Worker Node Security Group ID"
  value       = aws_security_group.eks_worker.id
}

output "rds_security_group_id" {
  description = "RDS Security Group ID"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID"
  value       = aws_security_group.elasticache.id
}
