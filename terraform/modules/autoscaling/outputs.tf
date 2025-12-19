# autoscaling - outputs.tf

output "cluster_autoscaler_role_arn" {
  description = "IAM Role ARN for Cluster Autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}