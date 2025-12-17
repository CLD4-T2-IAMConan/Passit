output "vpc_id" {
  value = data.aws_vpc.this.id
}

output "dev_public_subnet_id" {
  value = aws_subnet.dev_public_c.id
}

output "dev_private_app_subnet_id" {
  value = aws_subnet.dev_private_app_c.id
}

output "dev_private_db_subnet_id" {
  value = aws_subnet.dev_private_db_c.id
}