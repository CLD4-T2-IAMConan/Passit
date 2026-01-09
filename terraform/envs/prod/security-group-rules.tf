# ============================================
# Additional Security Group Rules
# ============================================
# These rules are added after EKS cluster creation to allow
# EKS worker nodes to access RDS and ElastiCache

# RDS Security Group: Allow MySQL access from EKS Node Security Group
# NOTE: These rules already exist in AWS and are managed outside of Terraform
# Commenting them out to avoid duplicate rule errors
# resource "aws_security_group_rule" "rds_from_eks_nodes" {
#   type                     = "ingress"
#   from_port                = 3306
#   to_port                  = 3306
#   protocol                 = "tcp"
#   source_security_group_id = module.eks.node_security_group_id
#   security_group_id        = module.security.rds_security_group_id
#   description              = "Allow MySQL access from EKS worker nodes"
# }

# ElastiCache Security Group: Allow Valkey access from EKS Node Security Group
# NOTE: These rules already exist in AWS and are managed outside of Terraform
# Commenting them out to avoid duplicate rule errors
# resource "aws_security_group_rule" "elasticache_from_eks_nodes" {
#   type                     = "ingress"
#   from_port                = 6379
#   to_port                  = 6379
#   protocol                 = "tcp"
#   source_security_group_id = module.eks.node_security_group_id
#   security_group_id        = module.security.elasticache_security_group_id
#   description              = "Allow Valkey access from EKS worker nodes"
# }

