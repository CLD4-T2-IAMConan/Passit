# Network Module - VPC, Subnet, NAT, Route Table, Security Group

# ============================================
# VPC
# ============================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# ============================================
# Internet Gateway
# ============================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

# ============================================
# Public Subnets
# ============================================

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = length(var.public_subnet_cidrs) == 1 ? "${var.project_name}-${var.environment}-public" : "${var.project_name}-${var.environment}-public${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project     = var.project_name
    Environment = var.environment
    Type        = "public"
    "kubernetes.io/role/elb" = "1"
  }
}

# ============================================
# Private App Subnets (EKS용)
# ============================================

resource "aws_subnet" "private_app" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                            = length(var.private_subnet_cidrs) == 1 ? "${var.project_name}-${var.environment}-private-app" : "${var.project_name}-${var.environment}-private-app${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project                         = var.project_name
    Environment                     = var.environment
    Type                            = "private-app"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# ============================================
# Private DB Subnets (RDS, ElastiCache용)
# ============================================

resource "aws_subnet" "private_db" {
  count = length(var.private_db_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = length(var.private_db_subnet_cidrs) == 1 ? "${var.project_name}-${var.environment}-private-db" : "${var.project_name}-${var.environment}-private-db${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project     = var.project_name
    Environment = var.environment
    Type        = "private-db"
  }
}

# ============================================
# Elastic IP for NAT Gateway
# ============================================

resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnet_cidrs)) : 0

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = var.single_nat_gateway ? "${var.project_name}-${var.environment}-nat-eip" : "${var.project_name}-${var.environment}-nat-eip${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# ============================================
# NAT Gateway
# ============================================

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnet_cidrs)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = var.single_nat_gateway ? "${var.project_name}-${var.environment}-nat" : "${var.project_name}-${var.environment}-nat${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# ============================================
# Route Tables
# ============================================

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ============================================
# Private Route Tables
# ============================================
# Prod: AZ별로 App과 DB 서브넷이 같은 Route Table 공유 (private-rt-a, private-rt-c)
# Dev: 단일 NAT이므로 App과 DB 서브넷이 같은 Route Table 공유 (private-rt)
resource "aws_route_table" "private" {
  # Prod: App 서브넷 개수만큼 (AZ별), Dev: 1개
  count = var.single_nat_gateway ? 1 : length(aws_subnet.private_app)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_nat_gateway ? aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id : null
  }

  tags = {
    Name        = length(aws_subnet.private_app) == 1 ? "${var.project_name}-${var.environment}-private-rt" : "${var.project_name}-${var.environment}-private-rt${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project     = var.project_name
    Environment = var.environment
    Type        = "private"
  }
}

# Private App Route Table Associations
resource "aws_route_table_association" "private_app" {
  count = length(aws_subnet.private_app)

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

# Private DB Route Table Associations (같은 Route Table 사용)
resource "aws_route_table_association" "private_db" {
  count = length(aws_subnet.private_db)

  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

# ============================================
# VPC Endpoint (S3 Gateway)
# ============================================
# S3로 향하는 트래픽은 NAT Gateway를 우회하여 VPC Endpoint를 통해 전송
# Private Route Table에 자동으로 S3 프리픽스 리스트가 추가됨

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(aws_route_table.private[*].id)

  tags = {
    Name        = "${var.project_name}-${var.environment}-s3-vpce"
    Project     = var.project_name
    Environment = var.environment
  }
}
