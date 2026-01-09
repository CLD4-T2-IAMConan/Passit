# Backend Configuration
# 
# 주의: shared 폴더는 backend 리소스(S3, DynamoDB)를 생성하므로,
#       순환 참조를 피하기 위해 로컬 backend를 사용합니다.
#       
#       backend 리소스 생성 후, 필요하다면 아래 주석을 해제하여
#       S3 backend로 마이그레이션할 수 있습니다.

# 로컬 backend 사용 (초기 생성 시)
# terraform state는 terraform.tfstate 파일에 저장됩니다.

# S3 backend로 마이그레이션 (backend 리소스 생성 후)
# 주의: prod 버킷을 사용 (shared는 공통 리소스이므로 prod 버킷 사용)
# terraform {
#   backend "s3" {
#     bucket         = "passit-terraform-state-prod-kr"
#     key            = "shared/terraform.tfstate"
#     region         = "ap-northeast-2"
#     dynamodb_table = "passit-terraform-locks-prod"
#     encrypt        = true
#   }
# }