# Prod Environment Variables

# AWS
variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

# Common (Project / Tag)
variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "passit"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "team" {
  description = "Team name"
  type        = string
}

variable "owner" {
  description = "Owner name"
  type        = string
}

# Network
variable "vpc_id" {
  description = "VPC ID for Security Groups and EKS"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EKS"
  type        = list(string)
}

# EKS Cluster
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "EKS cluster version"
  type        = string
}

variable "eks_cluster_name" {
  description = "EKS Cluster name for IRSA (Security 모듈용)"
  type        = string
  default     = ""
}

# EKS Node Group
variable "node_instance_types" {
  description = "EC2 instance types for node group"
  type        = list(string)
}

variable "capacity_type" {
  description = "Capacity type (ON_DEMAND or SPOT)"
  type        = string
}

variable "node_min_size" {
  description = "Minimum number of nodes"
  type        = number
}

variable "node_desired_size" {
  description = "Desired number of nodes"
  type        = number
}

variable "node_max_size" {
  description = "Maximum number of nodes"
  type        = number
}

# Security Groups (Optional)
variable "rds_security_group_id" {
  description = "RDS Security Group ID (optional)"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (optional)"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for ALB access (prod environment)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Prod는 전체 인터넷 허용
}
