# --- 프로젝트 공통 변수 ---
variable "project_name" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "dev, prod 등 환경 구분"
}

# --- 앱 설정 변수 ---
variable "app_name" {
  type        = string
  description = "Application name (e.g., account, chat)"
}

variable "container_image" {
  type        = string
  description = "Docker image path (GHCR)"
}

variable "container_port" {
  type    = number
  default = 8080
}

variable "service_port" {
  type    = number
  default = 8080
}

variable "replicas" {
  type    = number
  default = 2
}

# --- DB 연결 변수 (앱이 접속하기 위한 정보) ---
variable "db_host" {
  type        = string
  description = "RDS Endpoint (Writer)"
}

variable "db_secret_name" {
  type    = string
  default = ""
}

# 시크릿이 없을 경우를 대비한 Fallback 변수들
variable "rds_master_username" {
  type    = string
  default = "admin"
}

variable "rds_master_password" {
  type    = string
  default = ""
}

variable "rds_database_name" {
  type    = string
  default = "passit_db"
}

# --- 인프라 정보 (VPC 정보 등은 필요시 데이터 조회용으로만 남겨둡니다) ---
variable "vpc_id" {
  type        = string
  description = "VPC ID"
}