# 도쿄 리전의 네트워크 정보를 가져옵니다 (도쿄 프로바이더 사용)
# data "aws_vpc" "tokyo_vpc" {
#   provider   = aws.tokyo
#   cidr_block = "10.3.0.0/16"
#   id         = "vpc-04bae7f4b39c4cd49"
#   tags = {
#     Name = "${var.project_name}-dr-vpc"
#   }
# }
data "aws_vpc" "tokyo_vpc" {
  provider = aws.tokyo
  filter {
    name   = "tag:Name"
    values = ["passit-dr-vpc"]
  }
}

data "aws_subnets" "tokyo_db_subnets" {
  provider = aws.tokyo
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.tokyo_vpc.id]
  }
  tags = {
    Name = "${var.project_name}-dr-private-db-*"
  }
}

# 도쿄 리전의 RDS 보안 그룹 가져오기
data "aws_security_group" "tokyo_rds_sg" {
  provider = aws.tokyo
  filter {
    name   = "group-name"
    values = ["passit-dr-rds-sg"] # 실제 도쿄 보안 그룹 이름 패턴에 맞게 수정하세요
  }
  vpc_id = data.aws_vpc.tokyo_vpc.id
}

# 도쿄 리전의 ElastiCache 보안 그룹 가져오기
data "aws_security_group" "tokyo_cache_sg" {
  provider = aws.tokyo
  filter {
    name   = "group-name"
    values = ["passit-dr-elasticache-sg"] # 실제 이름 패턴에 맞게 수정
  }
  vpc_id = data.aws_vpc.tokyo_vpc.id
}

data "aws_security_group" "tokyo_eks_node_sg" {
  provider = aws.tokyo
  filter {
    name   = "group-name"
    values = ["passit-dr-eks-sg"]
  }
  vpc_id = data.aws_vpc.tokyo_vpc.id
}