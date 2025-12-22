terraform {
  backend "s3" {
    bucket         = "passit-terraform-state-bucket"
    key            = "shared/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
  }
}