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

---

## 📚 문서

### 시작하기

- **[팀원용 빠른 시작 가이드](./docs/QUICK_START_FOR_TEAM.md)** - 신규 팀원을 위한 5분 온보딩 가이드
- **[배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)** - 전체 서비스 배포를 위한 단계별 가이드

### EKS 접근 관리

- **[EKS Access Entry 설정 가이드](./docs/EKS_ACCESS_SETUP_GUIDE.md)** - EKS 클러스터 접근 권한 설정 방법
  - Terraform을 통한 관리
  - AWS CLI를 통한 즉시 설정
  - kubectl ConfigMap 설정 (레거시)
  - 트러블슈팅 가이드

### 서비스 배포

- **[서비스 배포 가이드](./docs/SERVICE_DEPLOYMENT_GUIDE.md)** - 마이크로서비스 배포 및 관리
- **[ArgoCD 설정](./argocd/README.md)** - App of Apps 패턴으로 모든 서비스 관리

### 운영 가이드

- **[수동 운영 가이드](./docs/MANUAL_OPERATIONS.md)** - Pod 상태 확인, 헬스체크, 로그 확인 등 수동 운영 방법

- **[Bastion 빠른 시작](./docs/BASTION_QUICK_START.md)** - Session Manager를 통한 데이터베이스 접속
- **[스크립트 가이드](./scripts/README.md)** - 배포 자동화 스크립트 사용법

---

## 🚀 빠른 시작

### 신규 팀원 온보딩

```bash
# 1. IAM ARN 확인
aws sts get-caller-identity

# 2. EKS Access Entry 추가 (관리자가 실행 또는 셀프 서비스)
cd terraform
./scripts/add-eks-user.sh "arn:aws:iam::727646470302:user/t2-yourname"

# 3. kubectl 설정
aws eks update-kubeconfig --name passit-dev-eks --region ap-northeast-2

# 4. 접근 확인
kubectl get nodes
kubectl get pods -n services
```

자세한 내용은 **[팀원용 빠른 시작 가이드](./docs/QUICK_START_FOR_TEAM.md)** 참고

### EKS Access Entry 오류 해결

`Unauthorized` 또는 `AccessDeniedException` 오류가 발생하면:

```bash
# 현재 등록된 사용자 확인
aws eks list-access-entries --cluster-name passit-dev-eks --region ap-northeast-2

# 자신의 ARN이 없다면 추가 (3가지 방법)
# 방법 1: 스크립트 사용 (가장 쉬움)
./scripts/add-eks-user.sh "arn:aws:iam::727646470302:user/t2-yourname"

# 방법 2: Terraform에 추가 후 apply
# modules/eks/main.tf 편집 후
cd envs/dev
terraform apply

# 방법 3: AWS CLI 직접 사용
aws eks create-access-entry \
  --cluster-name passit-dev-eks \
  --principal-arn "YOUR_ARN" \
  --region ap-northeast-2
aws eks associate-access-policy \
  --cluster-name passit-dev-eks \
  --principal-arn "YOUR_ARN" \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region ap-northeast-2
```

자세한 내용은 **[EKS Access Entry 설정 가이드](./docs/EKS_ACCESS_SETUP_GUIDE.md)** 참고

---

## 🔧 유용한 명령어

### Terraform

```bash
# 개발 환경 배포
cd envs/dev
terraform init
terraform plan
terraform apply

# Output 확인
terraform output
terraform output -json > outputs.json

# 특정 리소스만 재배포
terraform apply -target=module.eks
```

### kubectl

```bash
# 클러스터 정보
kubectl cluster-info
kubectl get nodes

# 서비스 확인
kubectl get pods -n services
kubectl get svc -n services
kubectl get ingress -n services

# 로그 확인
kubectl logs -n services <POD_NAME>
kubectl logs -f -n services <POD_NAME>  # 실시간

# ArgoCD 확인
kubectl get applications -n argocd
kubectl get pods -n argocd
```

### 스크립트

```bash
cd terraform

# EKS 접속
./scripts/connect-eks.sh dev

# Kubernetes 기본 설정
export GITHUB_USERNAME="your_username"
export GITHUB_PAT="your_pat"
./scripts/setup-k8s-prerequisites.sh dev

# RDS 접속 (Session Manager)
./scripts/connect-bastion-rds.sh dev

# Redis 접속 (Session Manager)
./scripts/connect-bastion-redis.sh dev
```

---

## 🆘 트러블슈팅

### EKS 접근 오류

**증상**: `Unauthorized`, `AccessDeniedException`, `eks:DescribeCluster 권한 없음`

**해결**: [EKS Access Entry 설정 가이드](./docs/EKS_ACCESS_SETUP_GUIDE.md) 참고

### Pod가 ImagePullBackOff

**증상**: Pod가 `ImagePullBackOff` 상태

**해결**:
```bash
# GHCR Pull Secret 확인
kubectl get secret ghcr-pull-secret -n services

# 없다면 생성
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --namespace=services
```

### Terraform State Lock

**증상**: `Error: Error acquiring the state lock`

**해결**:
```bash
# Lock 정보 확인
aws dynamodb get-item \
  --table-name passit-terraform-locks-dev \
  --key '{"LockID":{"S":"passit-terraform-state-dev-kr/terraform.tfstate-md5"}}'

# 강제 해제 (주의: 다른 사람이 작업 중이 아닌지 확인!)
terraform force-unlock <LOCK_ID>
```

---

## 📞 지원

- **Slack**: #devops-support
- **이슈**: GitHub Issues
- **문서**: [docs/](./docs/) 디렉토리
