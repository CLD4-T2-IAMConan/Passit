# Data Module Outputs
output "rds_cluster_endpoint" {
  description = "The cluster endpoint for RDS Aurora"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_reader_endpoint" {
  description = "The reader endpoint for RDS Aurora"
  value       = aws_rds_cluster.main.reader_endpoint
}