# Provider Configuration

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.95.0, < 6.0.0"
    }
  }
}

provider "aws" {
  region = var.region

  # KMS 키 생성 시 kms:TagResource 권한이 필요한 경우를 위해
  # default_tags를 제거하고 필요한 리소스에만 개별적으로 태그를 추가합니다
  # default_tags {
  #   tags = {
  #     Project     = var.project_name
  #     Environment = "dev"
  #     ManagedBy   = "Terraform"
  #   }
  # }
>>>>>>> develop
}
