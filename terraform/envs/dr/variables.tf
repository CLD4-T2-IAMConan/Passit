# DR Environment Variables

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "passit"
}

variable "vpc_id" {
  description = "VPC ID for Security Groups (Network 모듈에서 가져올 예정)"
  type        = string
  default     = "" # 초기에는 빈 문자열, Network 모듈 생성 후 업데이트
}

variable "eks_cluster_name" {
  description = "EKS Cluster name for IRSA (EKS 모듈에서 가져올 예정)"
  type        = string
  default     = "" # 초기에는 빈 문자열, EKS 모듈 생성 후 업데이트
}

variable "rds_security_group_id" {
  description = "RDS Security Group ID (optional)"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (optional)"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for ALB access (dr environment)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # DR은 전체 인터넷 허용
}
