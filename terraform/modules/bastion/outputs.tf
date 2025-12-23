# Bastion Host Module Outputs

output "bastion_instance_id" {
  description = "Bastion Host EC2 인스턴스 ID"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Bastion Host 퍼블릭 IP"
  value       = aws_instance.bastion.public_ip
}

output "bastion_private_ip" {
  description = "Bastion Host 프라이빗 IP"
  value       = aws_instance.bastion.private_ip
}

output "bastion_security_group_id" {
  description = "Bastion Host Security Group ID"
  value       = aws_security_group.bastion.id
}

output "bastion_iam_role_arn" {
  description = "Bastion Host IAM Role ARN (Session Manager용)"
  value       = var.enable_session_manager ? aws_iam_role.bastion[0].arn : null
}

output "ssh_command" {
  description = "SSH 접속 명령어 (키페어 사용 시)"
  value       = var.key_name != "" ? "ssh -i ${var.key_name}.pem ec2-user@${aws_instance.bastion.public_ip}" : "Use Session Manager to connect"
}

output "session_manager_command" {
  description = "Session Manager 접속 명령어"
  value       = "aws ssm start-session --target ${aws_instance.bastion.id} --region ${var.region}"
}

output "ssh_tunnel_rds_command" {
  description = "RDS SSH 터널링 명령어 (로컬 5432 -> RDS 5432)"
  value       = var.key_name != "" ? "ssh -i ${var.key_name}.pem -L 5432:<RDS_ENDPOINT>:5432 -N ec2-user@${aws_instance.bastion.public_ip}" : "Use Session Manager port forwarding"
}

output "ssh_tunnel_elasticache_command" {
  description = "ElastiCache SSH 터널링 명령어 (로컬 6379 -> ElastiCache 6379)"
  value       = var.key_name != "" ? "ssh -i ${var.key_name}.pem -L 6379:<ELASTICACHE_ENDPOINT>:6379 -N ec2-user@${aws_instance.bastion.public_ip}" : "Use Session Manager port forwarding"
}
