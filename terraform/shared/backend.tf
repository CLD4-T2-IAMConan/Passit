# Backend Configuration
# 
# 주의: shared 폴더는 backend 리소스(S3, DynamoDB)를 생성하므로,
#       순환 참조를 피하기 위해 로컬 backend를 사용합니다.
#       
#       backend 리소스 생성 후, 필요하다면 아래 주석을 해제하여
#       S3 backend로 마이그레이션할 수 있습니다.

# 로컬 backend 사용 (기본값)
# terraform state는 terraform.tfstate 파일에 저장됩니다.

# S3 backend로 마이그레이션하려면 아래 주석을 해제하세요:
# terraform {
#   backend "s3" {
#     bucket         = "passit-terraform-state-dev"
#     key            = "shared/terraform.tfstate"
#     region         = "ap-northeast-2"
#     dynamodb_table = "passit-terraform-locks-dev"
#     encrypt        = true
#   }
# }