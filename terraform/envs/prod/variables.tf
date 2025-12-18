# ============================================
# Common Variables
# ============================================

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "team" {
  description = "Team name"
  type        = string
}

variable "owner" {
  description = "Owner name"
  type        = string
}

# ============================================
# Network Variables
# ============================================

variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}

variable "private_db_subnet_cidrs" {
  type    = list(string)
  default = []
}

variable "enable_nat_gateway" {
  type = bool
}

variable "single_nat_gateway" {
  type = bool
}

# ============================================
# EKS Variables
# ============================================

variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  type = string
}

variable "eks_cluster_name" {
  description = "Security module reference"
  type        = string
}

variable "node_instance_types" {
  type = list(string)
}

variable "capacity_type" {
  type = string
}

variable "node_min_size" {
  type = number
}

variable "node_desired_size" {
  type = number
}

variable "node_max_size" {
  type = number
}

# ============================================
# Security Variables
# ============================================

variable "allowed_cidr_blocks" {
  type = list(string)
}

variable "rds_security_group_id" {
  type    = string
  default = null
}

variable "elasticache_security_group_id" {
  type    = string
  default = null
}