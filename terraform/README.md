# Terraform Infrastructure

전체 인프라 구조 설명

## 구조

### modules/

재사용 가능한 공통 모듈들

- **network/**: VPC, Subnet, NAT, Route Table, Security Group
- **eks/**: EKS 클러스터 + Node Group
- **security/**: IAM, IRSA, KMS
- **data/**: RDS, MemoryDB (Valkey)
- **cicd/**: CI/CD 지원 인프라 (ArgoCD, RBAC, IRSA, GHCR)
- **monitoring/**: 모니터링 및 로깅 (Prometheus, Grafana, Fluent Bit, CloudWatch)

### envs/

환경별 실제 배포 단위

- **dev/**: 개발 환경
- **prod/**: 프로덕션 환경
- **dr/**: 재해 복구 환경

각 환경은 독립적인 Terraform state를 가지며, S3 + DynamoDB를 backend로 사용합니다.
