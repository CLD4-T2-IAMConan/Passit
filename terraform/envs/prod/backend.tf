# Backend Configuration (S3 + DynamoDB)
# 주의: 실제 사용 시 S3 버킷과 DynamoDB 테이블이 먼저 생성되어야 합니다

terraform {
  backend "s3" {
    bucket         = "passit-terraform-state-prod-kr" # terraform/shared에서 확인 필요
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "passit-terraform-locks-prod" # terraform/shared에서 확인 필요
    encrypt        = true
  }
}

# 주의: 버킷 이름은 terraform/shared에서 생성 후 outputs로 확인하세요
# 또는 terraform/shared에서 terraform output으로 확인

# 초기 개발 단계에서는 로컬 state 사용 (위의 backend 설정은 주석 처리)
# 프로덕션 배포 전에 S3 backend로 전환하세요
