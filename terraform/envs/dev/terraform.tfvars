# Dev Environment Variables Values


account_id   = "727646470302"
region       = "ap-northeast-2"

# Common (Project / Tag)
project_name = "passit"
environment  = "dev"
team         = "t2"
owner        = "iamconan"

# Network 모듈이 생성되면 아래 값들을 업데이트하세요
vpc_id = ""

# EKS Cluster
cluster_name    = "passit-dev-eks"
cluster_version = "1.29"

# EKS Node Group (Dev)
node_instance_types = ["t3.small"]

capacity_type = "ON_DEMAND"

node_min_size     = 1
node_desired_size = 1
node_max_size     = 3

# 선택적 변수
rds_security_group_id       = ""
elasticache_security_group_id = ""