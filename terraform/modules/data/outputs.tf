# Data Module Outputs

# ============================================
# RDS Outputs
# ============================================
output "rds_cluster_endpoint" {
  description = "The cluster endpoint for RDS Aurora"
  value       = try(aws_rds_cluster.main[0].endpoint, "")
}

output "rds_reader_endpoint" {
  description = "The reader endpoint for RDS Aurora"
  value       = try(aws_rds_cluster.main[0].reader_endpoint, "")
}

# ============================================
# ElastiCache (Valkey) Outputs
# ============================================

output "valkey_replication_group_id" {
  description = "ElastiCache Replication Group ID"
  # aws_elasticache_replication_group.valkey[0] 로 접근하고,
  # 없으면(count=0) 빈 문자열을 반환합니다.
  value       = try(aws_elasticache_replication_group.valkey[0].replication_group_id, "")
}

output "valkey_primary_endpoint" {
  description = "ElastiCache primary endpoint address"
  value       = try(aws_elasticache_replication_group.valkey[0].primary_endpoint_address, "")
}

output "valkey_port" {
  description = "ElastiCache port"
  value       = try(aws_elasticache_replication_group.valkey[0].port, null)
}

output "valkey_reader_endpoint" {
  description = "ElastiCache reader endpoint address"
  value       = try(aws_elasticache_replication_group.valkey[0].reader_endpoint_address, "")
}

output "valkey_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Valkey connection info"
  value       = try(aws_secretsmanager_secret.valkey[0].arn, "")
}

# ============================================
# S3 Outputs
# ============================================

output "s3_bucket_ids" {
  description = "Map of S3 bucket names to bucket IDs"
  value = {
    for bucket_name, bucket in aws_s3_bucket.this :
    bucket_name => bucket.id
  }
}

output "s3_bucket_arns" {
  description = "Map of S3 bucket names to bucket ARNs"
  value = {
    for bucket_name, bucket in aws_s3_bucket.this :
    bucket_name => bucket.arn
  }
}

output "s3_uploads_bucket_id" {
  description = "S3 uploads bucket ID"
  value       = try(aws_s3_bucket.this["uploads"].id, null)
}

output "s3_logs_bucket_id" {
  description = "S3 logs bucket ID"
  value       = try(aws_s3_bucket.this["logs"].id, null)
}

output "s3_backup_bucket_id" {
  description = "S3 backup bucket ID"
  value       = try(aws_s3_bucket.this["backup"].id, null)
}
