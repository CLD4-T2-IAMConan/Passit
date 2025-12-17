provider "aws" {
  region = var.region
}

data "aws_vpc" "prod" {
  id = var.prod_vpc_id
}

resource "aws_subnet" "prod_public_a" {
  vpc_id                  = data.aws_vpc.prod.id
  cidr_block              = var.prod_public_a_cidr
  availability_zone       = var.az_a
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-prod-public-a"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "public"
  }
}

resource "aws_subnet" "prod_public_c" {
  vpc_id                  = data.aws_vpc.prod.id
  cidr_block              = var.prod_public_c_cidr
  availability_zone       = var.az_c
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-prod-public-c"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "public"
  }
}

resource "aws_subnet" "prod_private_app_a" {
  vpc_id            = data.aws_vpc.prod.id
  cidr_block        = var.prod_private_app_a_cidr
  availability_zone = var.az_a

  tags = {
    Name        = "${var.project_name}-prod-private-app-a"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
    Role        = "app"
  }
}

resource "aws_subnet" "prod_private_app_c" {
  vpc_id            = data.aws_vpc.prod.id
  cidr_block        = var.prod_private_app_c_cidr
  availability_zone = var.az_c

  tags = {
    Name        = "${var.project_name}-prod-private-app-c"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
    Role        = "app"
  }
}

resource "aws_subnet" "prod_private_db_a" {
  vpc_id            = data.aws_vpc.prod.id
  cidr_block        = var.prod_private_db_a_cidr
  availability_zone = var.az_a

  tags = {
    Name        = "${var.project_name}-prod-private-db-a"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
    Role        = "db"
  }
}

resource "aws_subnet" "prod_private_db_c" {
  vpc_id            = data.aws_vpc.prod.id
  cidr_block        = var.prod_private_db_c_cidr
  availability_zone = var.az_c

  tags = {
    Name        = "${var.project_name}-prod-private-db-c"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
    Role        = "db"
  }
}

# =========================
# PROD - Internet Gateway (IGW)
# =========================
resource "aws_internet_gateway" "prod_igw" {
  vpc_id = data.aws_vpc.prod.id

  tags = {
    Name        = "${var.project_name}-prod-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

# =========================
# PROD - Public Route Table
# =========================
resource "aws_route_table" "prod_public_rt" {
  vpc_id = data.aws_vpc.prod.id

  tags = {
    Name        = "${var.project_name}-prod-public-rt"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "public"
  }
}

# 기본 경로(0.0.0.0/0) -> IGW
resource "aws_route" "prod_public_default_route" {
  route_table_id         = aws_route_table.prod_public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.prod_igw.id
}

# Public Subnet 연결
resource "aws_route_table_association" "prod_public_a_assoc" {
  subnet_id      = aws_subnet.prod_public_a.id
  route_table_id = aws_route_table.prod_public_rt.id
}

resource "aws_route_table_association" "prod_public_c_assoc" {
  subnet_id      = aws_subnet.prod_public_c.id
  route_table_id = aws_route_table.prod_public_rt.id
}

# =========================
# PROD - Private Route Tables (A/C)
# =========================

resource "aws_route_table" "prod_private_rt_a" {
  vpc_id = data.aws_vpc.prod.id

  tags = {
    Name        = "${var.project_name}-prod-private-rt-a"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
  }
}

resource "aws_route_table" "prod_private_rt_c" {
  vpc_id = data.aws_vpc.prod.id

  tags = {
    Name        = "${var.project_name}-prod-private-rt-c"
    Project     = var.project_name
    Environment = var.environment
    Tier        = "private"
  }
}

# Private Subnet 연결 (APP/DB 각각 A/C)
resource "aws_route_table_association" "prod_private_app_a_assoc" {
  subnet_id      = aws_subnet.prod_private_app_a.id
  route_table_id = aws_route_table.prod_private_rt_a.id
}

resource "aws_route_table_association" "prod_private_db_a_assoc" {
  subnet_id      = aws_subnet.prod_private_db_a.id
  route_table_id = aws_route_table.prod_private_rt_a.id
}

resource "aws_route_table_association" "prod_private_app_c_assoc" {
  subnet_id      = aws_subnet.prod_private_app_c.id
  route_table_id = aws_route_table.prod_private_rt_c.id
}

resource "aws_route_table_association" "prod_private_db_c_assoc" {
  subnet_id      = aws_subnet.prod_private_db_c.id
  route_table_id = aws_route_table.prod_private_rt_c.id
}

# =========================
# PROD - NAT Gateway (A/C)
# =========================

# EIP for NAT (AZ A)
resource "aws_eip" "prod_nat_eip_a" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip-a"
    Project     = var.project_name
    Environment = var.environment
  }
}

# NAT Gateway (AZ A) - in Public Subnet A
resource "aws_nat_gateway" "prod_nat_a" {
  allocation_id = aws_eip.prod_nat_eip_a.id
  subnet_id     = aws_subnet.prod_public_a.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-a"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.prod_igw]
}

# EIP for NAT (AZ C)
resource "aws_eip" "prod_nat_eip_c" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip-c"
    Project     = var.project_name
    Environment = var.environment
  }
}

# NAT Gateway (AZ C) - in Public Subnet C
resource "aws_nat_gateway" "prod_nat_c" {
  allocation_id = aws_eip.prod_nat_eip_c.id
  subnet_id     = aws_subnet.prod_public_c.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-c"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.prod_igw]
}

# =========================
# PROD - Private Route (NAT)
# =========================

# private-rt-a : 0.0.0.0/0 -> NAT A
resource "aws_route" "prod_private_nat_route_a" {
  route_table_id         = aws_route_table.prod_private_rt_a.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.prod_nat_a.id
}

# private-rt-c : 0.0.0.0/0 -> NAT C
resource "aws_route" "prod_private_nat_route_c" {
  route_table_id         = aws_route_table.prod_private_rt_c.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.prod_nat_c.id
}