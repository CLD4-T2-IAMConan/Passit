# Dev Environment - Module Calls

# ============================================
# Network Module (VPC, Subnets, NAT Gateway)
# ============================================

module "network" {
  source = "../../modules/network"

  # Common
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # VPC Configuration
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones

  # Subnet Configuration
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  private_db_subnet_cidrs = var.private_db_subnet_cidrs

  # NAT Gateway Configuration
  enable_nat_gateway  = var.enable_nat_gateway
  single_nat_gateway  = var.single_nat_gateway
}

# ============================================
# Security Module
# ============================================

module "security" {
  source = "../../modules/security"

  # 필수 변수
  account_id   = var.account_id
  environment  = "dev"
  region       = var.region
  project_name = var.project_name

  # 네트워크 의존성 (Network 모듈에서 가져옴)
  vpc_id = module.network.vpc_id

  # EKS 의존성 (EKS 모듈이 생성되면 실제 값으로 교체)
  eks_cluster_name = var.eks_cluster_name

  # 보안 그룹 설정
  allowed_cidr_blocks = var.allowed_cidr_blocks

  # 선택적 변수
  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id
}

# ============================================
# EKS Module
# ============================================

module "eks" {
  source = "../../modules/eks"

  # Common
  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner

  # EKS Cluster
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Network (Network 모듈에서 가져옴)
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids

  # Node Group
  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type

  node_min_size     = var.node_min_size
  node_desired_size = var.node_desired_size
  node_max_size     = var.node_max_size
>>>>>>> 246189cae8776e37146f0ef4ebdfa29569680c63
}

# =========================
# DEV - Subnets (AZ C)
# =========================

# DEV - Public Subnet (AZ C)
resource "aws_subnet" "dev_public_c" {
  vpc_id                  = data.aws_vpc.this.id
  cidr_block              = var.dev_public_cidr
  availability_zone       = var.dev_az
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "public"
  }
}

# DEV - Private Subnet (APP, AZ C)
resource "aws_subnet" "dev_private_app_c" {
  vpc_id            = data.aws_vpc.this.id
  cidr_block        = var.dev_private_app_cidr
  availability_zone = var.dev_az

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-app"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
    Role        = "app"
  }
}

# DEV - Private Subnet (DB, AZ C)
resource "aws_subnet" "dev_private_db_c" {
  vpc_id            = data.aws_vpc.this.id
  cidr_block        = var.dev_private_db_cidr
  availability_zone = var.dev_az

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-db"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
    Role        = "db"
  }
}

# =========================
# DEV - Internet Gateway (IGW)
# =========================
resource "aws_internet_gateway" "dev_igw" {
  vpc_id = data.aws_vpc.this.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

# =========================
# DEV - Public Route Table
# =========================
resource "aws_route_table" "dev_public_rt" {
  vpc_id = data.aws_vpc.this.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "public"
  }
}

# 기본 경로(0.0.0.0/0) -> IGW
resource "aws_route" "dev_public_default_route" {
  route_table_id         = aws_route_table.dev_public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.dev_igw.id
}

# Public Subnet 연결 (DEV는 public 1개)
resource "aws_route_table_association" "dev_public_assoc" {
  subnet_id      = aws_subnet.dev_public_c.id
  route_table_id = aws_route_table.dev_public_rt.id
}

# =========================
# DEV - Private Route Table
# =========================
resource "aws_route_table" "dev_private_rt" {
  vpc_id = data.aws_vpc.this.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-rt"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
  }
}

# Private Subnet 연결 (APP/DB)
resource "aws_route_table_association" "dev_private_app_assoc" {
  subnet_id      = aws_subnet.dev_private_app_c.id
  route_table_id = aws_route_table.dev_private_rt.id
}

resource "aws_route_table_association" "dev_private_db_assoc" {
  subnet_id      = aws_subnet.dev_private_db_c.id
  route_table_id = aws_route_table.dev_private_rt.id
}

# =========================
# DEV - NAT Gateway
# =========================

# Elastic IP for NAT
resource "aws_eip" "dev_nat_eip" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip"
    Project     = var.project_name
    Environment = var.environment
  }
}

# NAT Gateway (Public Subnet)
resource "aws_nat_gateway" "dev_nat" {
  allocation_id = aws_eip.dev_nat_eip.id
  subnet_id     = aws_subnet.dev_public_c.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.dev_igw]
}

# =========================
# DEV - Private Route (NAT)
# =========================
resource "aws_route" "dev_private_nat_route" {
  route_table_id         = aws_route_table.dev_private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.dev_nat.id
}