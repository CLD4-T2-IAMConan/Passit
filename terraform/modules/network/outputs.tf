# Network Module Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = var.use_existing_vpc ? data.aws_vpc.existing[0].cidr_block : aws_vpc.main[0].cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = var.use_existing_vpc ? local.existing_public_subnet_ids : aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private app subnet IDs (EKS용)"
  value       = var.use_existing_vpc ? local.existing_private_subnet_ids : aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "Private db subnet IDs (RDS, ElastiCache용)"
  value       = var.use_existing_vpc ? local.existing_private_db_subnet_ids : aws_subnet.private_db[*].id
}

output "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  value       = var.use_existing_vpc ? [] : aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "Private app subnet CIDR blocks"
  value       = var.use_existing_vpc ? [] : aws_subnet.private_app[*].cidr_block
}

output "private_db_subnet_cidrs" {
  description = "Private db subnet CIDR blocks"
  value       = var.use_existing_vpc ? [] : aws_subnet.private_db[*].cidr_block
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = var.use_existing_vpc ? [] : aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = var.use_existing_vpc ? null : aws_internet_gateway.main[0].id
}
