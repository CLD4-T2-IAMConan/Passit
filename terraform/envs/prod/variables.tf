# Prod Environment Variables

# AWS
variable "account_id" {
  type = string
}

variable "region" {
  type = string
}

# Common (Project / Tag)
variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "team" {
  type = string
}

variable "owner" {
  type = string
}

# Network
variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

# EKS Cluster
variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  type = string
}

# EKS Node Group
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

# Optional
variable "rds_security_group_id" {
  type    = string
  default = ""
}

variable "elasticache_security_group_id" {
  type    = string
  default = ""
}
