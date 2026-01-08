# 도쿄 리전의 네트워크 정보를 가져옵니다 (도쿄 프로바이더 사용)
# DR 리전이 활성화된 경우에만 사용됩니다
# data "aws_vpc" "tokyo_vpc" {
#   provider   = aws.tokyo
#   cidr_block = "10.3.0.0/16"
#   id         = "vpc-04bae7f4b39c4cd49"
#   tags = {
#     Name = "${var.project_name}-dr-vpc"
#   }
# }
data "aws_vpc" "tokyo_vpc" {
  count    = var.enable_dr ? 1 : 0
  provider = aws.tokyo
  filter {
    name   = "tag:Name"
    values = ["passit-dr-vpc"]
  }
}

data "aws_subnets" "tokyo_db_subnets" {
  count    = var.enable_dr ? 1 : 0
  provider = aws.tokyo
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.tokyo_vpc[0].id]
  }
  tags = {
    Name = "${var.project_name}-dr-private-db-*"
  }
}

# 도쿄 리전의 RDS 보안 그룹 가져오기
data "aws_security_group" "tokyo_rds_sg" {
  count    = var.enable_dr ? 1 : 0
  provider = aws.tokyo
  filter {
    name   = "group-name"
    values = ["passit-dr-rds-sg"] # 실제 도쿄 보안 그룹 이름 패턴에 맞게 수정하세요
  }
  vpc_id = data.aws_vpc.tokyo_vpc[0].id
}

# 도쿄 리전의 ElastiCache 보안 그룹 가져오기
data "aws_security_group" "tokyo_cache_sg" {
  count    = var.enable_dr ? 1 : 0
  provider = aws.tokyo
  filter {
    name   = "group-name"
    values = ["passit-dr-elasticache-sg"] # 실제 이름 패턴에 맞게 수정
  }
  vpc_id = data.aws_vpc.tokyo_vpc[0].id
}

data "aws_security_group" "tokyo_eks_node_sg" {
  count    = var.enable_dr ? 1 : 0
  provider = aws.tokyo
  filter {
    name   = "group-name"
    values = ["passit-dr-eks-sg"]
  }
  vpc_id = data.aws_vpc.tokyo_vpc[0].id
}