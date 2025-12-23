terraform {
  backend "s3" {
    bucket         = "passit-terraform-state-dev"
    key            = "shared/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
  }
}