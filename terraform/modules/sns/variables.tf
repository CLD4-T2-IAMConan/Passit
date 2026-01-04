variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod, dr)"
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

variable "kms_key_id" {
  description = "KMS Key ID for SNS topic encryption (optional)"
  type        = string
  default     = ""
}

