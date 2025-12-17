# Dev Environment - Module Calls
terraform {
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.region
}

module "eks" {
  source = "../../modules/eks"

  # Common
  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner

  # EKS Cluster
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Network
  vpc_id             = var.vpc_id
  private_subnet_ids = var.private_subnet_ids

  # Node Group
  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type

  node_min_size     = var.node_min_size
  node_desired_size = var.node_desired_size
  node_max_size     = var.node_max_size
}