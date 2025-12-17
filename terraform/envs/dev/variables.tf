# Dev Environment Variables
variable "environment" {
  type    = string
  default = "dev"
}

variable "cluster_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}
