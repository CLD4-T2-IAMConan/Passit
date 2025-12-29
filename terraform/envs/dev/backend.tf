# Backend Configuration (S3 + DynamoDB)
terraform {
  backend "s3" {
    bucket         = "passit-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "passit-terraform-locks-dev"
  }
}