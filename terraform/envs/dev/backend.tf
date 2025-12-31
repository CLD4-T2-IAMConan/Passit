# Backend Configuration (S3 + DynamoDB)
terraform {
  backend "s3" {
    bucket         = "passit-tf-state-dev-46470302"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "passit-tf-locks-dev-46470302"
  }
}