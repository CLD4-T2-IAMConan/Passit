# Prod Environment Variables Values

account_id   = "727646470302"
region       = "ap-northeast-2"

# Common (Project / Tag)
project_name = "passit"
environment  = "prod"
team         = "t2"
owner        = "iamconan"

# Network 모듈이 생성되면 아래 값들을 업데이트하세요
vpc_id = ""

# EKS Cluster
cluster_name    = "passit-prod-eks"
cluster_version = "1.29"

# EKS Node Group (Prod)
node_instance_types = ["t3.medium"]

capacity_type = "ON_DEMAND"

node_min_size     = 2
node_desired_size = 2
node_max_size     = 10

# 선택적 변수
rds_security_group_id       = ""
elasticache_security_group_id = ""
