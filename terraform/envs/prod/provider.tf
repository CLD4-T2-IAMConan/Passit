# Provider Configuration

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.95.0, < 6.0.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.25.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.12.0"
    }
  }
}

# provider "aws" {
#   region = var.region
#
#   # default_tags {
#   #   tags = {
#   #     Project     = var.project_name
#   #     Environment = "prod"
#   #     ManagedBy   = "Terraform"
#   #   }
#   # }
# }
