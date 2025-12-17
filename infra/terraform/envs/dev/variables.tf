variable "project_name" {
  type        = string
  description = "Project name (e.g. passit)"
}

variable "environment" {
  type        = string
  description = "Environment (dev, prod)"
}

variable "region" {
  type        = string
  description = "AWS region"
  default     = "ap-northeast-2"
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC ID (e.g. vpc-xxxxxxxx)"
}

variable "dev_az" {
  type        = string
  description = "Dev subnet AZ (e.g. ap-northeast-2c)"
}

variable "dev_public_cidr" {
  type        = string
  description = "Dev public subnet CIDR (e.g. 10.1.1.0/24)"
}

variable "dev_private_app_cidr" {
  type        = string
  description = "Dev private app subnet CIDR (e.g. 10.1.11.0/24)"
}

variable "dev_private_db_cidr" {
  type        = string
  description = "Dev private db subnet CIDR (e.g. 10.1.21.0/24)"
}