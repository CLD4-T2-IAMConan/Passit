# Dev Environment - Module Calls
terraform {
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = "ap-northeast-2"
}

module "eks" {
  project_name       = "passit"
  source             = "../../modules/eks"
  vpc_id             = var.vpc_id
  private_subnet_ids = var.private_subnet_ids
  cluster_name       = "passit-dev"
  environment        = "dev"
}
