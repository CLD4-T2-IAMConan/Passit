# Network Module - VPC, Subnet, NAT, Route Table, Security Group

# ============================================
# VPC (Existing or New)
# ============================================

data "aws_vpc" "existing" {
  count = local.should_use_existing_vpc ? 1 : 0
  id    = var.existing_vpc_id
}

resource "aws_vpc" "main" {
  # existing_vpc_id가 제공되지 않으면 새 VPC 생성
  count = local.should_use_existing_vpc ? 0 : 1

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
# Existing Subnets (Data Sources)
# ============================================

data "aws_subnets" "existing_public" {
  count = local.should_use_existing_vpc ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing[0].id]
  }
  tags = {
    Type = "public"
  }
}

data "aws_subnets" "existing_private_app" {
  count = local.should_use_existing_vpc ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing[0].id]
  }
  tags = {
    Type = "private-app"
  }
}

data "aws_subnets" "existing_private_db" {
  count = local.should_use_existing_vpc ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing[0].id]
  }
  tags = {
    Type = "private-db"
  }
}

locals {
  # existing_vpc_id가 제공되면 기존 VPC 사용, 아니면 새 VPC 생성
  should_use_existing_vpc = var.use_existing_vpc && var.existing_vpc_id != ""
  
  vpc_id = local.should_use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id
  
  # 변수로 제공된 서브넷 ID가 있으면 우선 사용, 없으면 태그 기반 자동 감지
  existing_public_subnet_ids = local.should_use_existing_vpc ? (
    length(var.existing_public_subnet_ids) > 0 ? var.existing_public_subnet_ids : data.aws_subnets.existing_public[0].ids
  ) : []
  existing_private_subnet_ids = local.should_use_existing_vpc ? (
    length(var.existing_private_subnet_ids) > 0 ? var.existing_private_subnet_ids : data.aws_subnets.existing_private_app[0].ids
  ) : []
  existing_private_db_subnet_ids = local.should_use_existing_vpc ? (
    length(var.existing_private_db_subnet_ids) > 0 ? var.existing_private_db_subnet_ids : data.aws_subnets.existing_private_db[0].ids
  ) : []
}

# ============================================
# Internet Gateway
# ============================================

resource "aws_internet_gateway" "main" {
  count  = local.should_use_existing_vpc ? 0 : 1
  vpc_id = local.vpc_id

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
  count = local.should_use_existing_vpc ? 0 : length(var.public_subnet_cidrs)

  vpc_id                  = local.vpc_id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                     = length(var.public_subnet_cidrs) == 1 ? "${var.project_name}-${var.environment}-public" : "${var.project_name}-${var.environment}-public${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project                  = var.project_name
    Environment              = var.environment
    Type                     = "public"
    "kubernetes.io/role/elb" = "1"
  }
}

# ============================================
# Private App Subnets (EKS용)
# ============================================

resource "aws_subnet" "private_app" {
  count = local.should_use_existing_vpc ? 0 : length(var.private_subnet_cidrs)

  vpc_id            = local.vpc_id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                              = length(var.private_subnet_cidrs) == 1 ? "${var.project_name}-${var.environment}-private-app" : "${var.project_name}-${var.environment}-private-app${count.index == 0 ? "-a" : count.index == 1 ? "-c" : ""}"
    Project                           = var.project_name
    Environment                       = var.environment
    Type                              = "private-app"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# ============================================
# Private DB Subnets (RDS, ElastiCache용)
# ============================================

resource "aws_subnet" "private_db" {
  count = local.should_use_existing_vpc ? 0 : length(var.private_db_subnet_cidrs)

  vpc_id            = local.vpc_id
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
  count = local.should_use_existing_vpc ? 0 : (var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnet_cidrs)) : 0)

  domain     = "vpc"
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
  count = local.should_use_existing_vpc ? 0 : (var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnet_cidrs)) : 0)

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
  count  = local.should_use_existing_vpc ? 0 : 1
  vpc_id = local.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = local.should_use_existing_vpc ? 0 : length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# ============================================
# Private Route Tables
# ============================================
# Prod: AZ별로 App과 DB 서브넷이 같은 Route Table 공유 (private-rt-a, private-rt-c)
# Dev: 단일 NAT이므로 App과 DB 서브넷이 같은 Route Table 공유 (private-rt)
resource "aws_route_table" "private" {
  # 기존 VPC 사용 시 생성하지 않음
  count = local.should_use_existing_vpc ? 0 : (var.single_nat_gateway ? 1 : length(aws_subnet.private_app))

  vpc_id = local.vpc_id

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
  count = local.should_use_existing_vpc ? 0 : length(aws_subnet.private_app)

  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

# Private DB Route Table Associations (같은 Route Table 사용)
resource "aws_route_table_association" "private_db" {
  count = local.should_use_existing_vpc ? 0 : length(aws_subnet.private_db)

  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[count.index].id
}

# ============================================
# VPC Endpoint (S3 Gateway)
# ============================================
# S3로 향하는 트래픽은 NAT Gateway를 우회하여 VPC Endpoint를 통해 전송
# Private Route Table에 자동으로 S3 프리픽스 리스트가 추가됨

resource "aws_vpc_endpoint" "s3" {
  count = local.should_use_existing_vpc ? 0 : 1
  
  vpc_id            = local.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = length(aws_route_table.private) > 0 ? aws_route_table.private[*].id : []

  tags = {
    Name        = "${var.project_name}-${var.environment}-s3-vpce"
    Project     = var.project_name
    Environment = var.environment
  }
}
