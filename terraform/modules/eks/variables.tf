# EKS Module Variables
variable "region" {
  description = "AWS Region"
  type        = string
}

variable "project_name" {
  description = "Project name tag for all EKS resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.29"
}

variable "vpc_id" {
  description = "VPC ID where EKS cluster will be created"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EKS cluster and nodes"
  type        = list(string)
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDR blocks that can access the public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}


# Tag-related variables
variable "team" {
  description = "Team name for resource tagging"
  type        = string
}

variable "owner" {
  description = "Owner name or GitHub ID for resource tagging"
  type        = string
}


# EKS Node Group variables
variable "node_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
}

variable "capacity_type" {
  description = "Capacity type for EKS Node Group (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"

  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.capacity_type)
    error_message = "capacity_type must be either ON_DEMAND or SPOT."
  }
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
}


#variable "enable_cluster_creator_admin_permissions" {
#  type    = bool
#  default = true
#}


variable "access_entries" {
  description = "Map of access entries to add to the EKS cluster. Key is the entry name, value is the access entry configuration."
  type = map(object({
    principal_arn = string
    policy_associations = optional(map(object({
      policy_arn = string
      access_scope = optional(object({
        type       = string
        namespaces = optional(list(string))
      }))
    })))
  }))
  default = {}
}

variable "node_security_group_id" {
  description = "The ID of the security group for EKS nodes"
  type        = string
  default     = null
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}
