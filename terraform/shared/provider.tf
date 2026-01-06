# Provider Configuration for Shared Resources
#
# shared 폴더는 backend 리소스(S3, DynamoDB)만 생성하므로
# AWS provider만 필요합니다.

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
  region = "ap-northeast-2"
}

provider "aws" {
  alias  = "tokyo"
  region = "ap-northeast-1" # 도쿄 추가
}