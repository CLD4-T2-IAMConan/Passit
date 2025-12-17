variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "region" {
  type = string
}

variable "prod_vpc_cidr" {
  type = string
}

variable "az_a" {
  type = string
}

variable "az_c" {
  type = string
}

variable "prod_public_a_cidr" {
  type = string
}

variable "prod_public_c_cidr" {
  type = string
}

variable "prod_private_app_a_cidr" {
  type = string
}

variable "prod_private_app_c_cidr" {
  type = string
}

variable "prod_private_db_a_cidr" {
  type = string
}

variable "prod_private_db_c_cidr" {
  type = string
}

variable "prod_vpc_id" {
  type = string
}