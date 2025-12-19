# Data Module Outputs

# ============================================
# ElastiCache (Valkey) Outputs
# ============================================

output "valkey_replication_group_id" {
  description = "ElastiCache Replication Group ID"
  value       = aws_elasticache_replication_group.valkey.replication_group_id
}

output "valkey_primary_endpoint" {
  description = "ElastiCache primary endpoint address"
  value       = aws_elasticache_replication_group.valkey.primary_endpoint_address
}

output "valkey_port" {
  description = "ElastiCache port"
  value       = aws_elasticache_replication_group.valkey.port
}

output "valkey_reader_endpoint" {
  description = "ElastiCache reader endpoint address"
  value       = aws_elasticache_replication_group.valkey.reader_endpoint_address
}

output "valkey_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Valkey connection info"
  value       = aws_secretsmanager_secret.valkey.arn
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
