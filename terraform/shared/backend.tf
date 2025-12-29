# Backend Configuration (S3 + DynamoDB)
# 주의: backend-bootstrap.tf를 사용할 때는 이 파일을 주석 처리해야 합니다.
# 부트스트랩 완료 후 주석을 해제하고 terraform init -migrate-state를 실행하세요.

# DEV 환경용 Backend 설정
terraform {
  backend "s3" {
    bucket         = "passit-terraform-state-dev"
    key            = "shared/terraform.tfstate"
    region         = "ap-northeast-2"
  }
}