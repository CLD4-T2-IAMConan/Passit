# Bastion Host Module Variables

variable "project_name" {
  description = "프로젝트 이름 (태깅용)"
  type        = string
}

variable "environment" {
  description = "환경 이름 (dev, prod, dr)"
  type        = string
}

variable "region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_id" {
  description = "Bastion Host를 배포할 Public Subnet ID"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "Bastion Host SSH 접근 허용 CIDR 블록 (회사 IP 등)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # 보안을 위해 실제 환경에서는 특정 IP로 제한 필요
}

variable "instance_type" {
  description = "Bastion Host EC2 인스턴스 타입"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "SSH 키페어 이름 (선택적, Session Manager 사용 시 불필요)"
  type        = string
  default     = ""
}

variable "enable_session_manager" {
  description = "AWS Systems Manager Session Manager 활성화 (SSH 키 없이 접근)"
  type        = bool
  default     = true
}

variable "rds_security_group_id" {
  description = "RDS Security Group ID (Bastion에서 접근 허용)"
  type        = string
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (Bastion에서 접근 허용)"
  type        = string
}

variable "eks_cluster_security_group_id" {
  description = "EKS Cluster Security Group ID (선택적)"
  type        = string
  default     = null
}

variable "owner" {
  description = "리소스 소유자"
  type        = string
}

variable "team" {
  description = "팀 이름"
  type        = string
}

variable "tags" {
  description = "추가 태그"
  type        = map(string)
  default     = {}
}
