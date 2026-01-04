# Backend Configuration (S3 + DynamoDB)
# 주의: S3 버킷이 먼저 생성되어야 합니다
# 
# 사용 순서:
# 1. terraform/shared에서 backend 리소스 생성:
#    cd terraform/shared
#    terraform init && terraform apply
#
# 2. 버킷 생성 후 아래 주석을 해제하고 terraform init -migrate-state 실행:
#    cd terraform/envs/dev
#    terraform init -migrate-state

# 임시로 로컬 backend 사용 (버킷 생성 전까지)
# 
# 버킷 생성 후 아래 주석을 해제하고 terraform init -migrate-state 실행
# 버킷 이름은 terraform/shared/outputs.tf에서 확인하세요
terraform {
  backend "s3" {
    bucket         = "passit-terraform-state-dev"  # terraform/shared에서 확인
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "passit-terraform-locks-dev"  # terraform/shared에서 확인
    encrypt        = true
  }
}