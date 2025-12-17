output "prod_vpc_id" {
  value = data.aws_vpc.prod.id
}

output "prod_public_a_subnet_id" {
  value = aws_subnet.prod_public_a.id
}

output "prod_public_c_subnet_id" {
  value = aws_subnet.prod_public_c.id
}

output "prod_private_app_a_subnet_id" {
  value = aws_subnet.prod_private_app_a.id
}

output "prod_private_app_c_subnet_id" {
  value = aws_subnet.prod_private_app_c.id
}

output "prod_private_db_a_subnet_id" {
  value = aws_subnet.prod_private_db_a.id
}

output "prod_private_db_c_subnet_id" {
  value = aws_subnet.prod_private_db_c.id
}