# Passit 배포 가이드 (Dev/Prod 공용 Runbook)

Terraform 기반 AWS 인프라(EKS, RDS, Valkey 등) 위에 ArgoCD App of Apps 패턴을 사용하여 Passit 서비스를 배포하기 위한 **Dev / Prod 공용 표준 Runbook**입니다.

---

## 👋 이 문서를 읽기 전에!!!

- 이 문서는 **Dev** 환경 기준으로 설명합니다.
- Prod는 Dev에서 검증 후 동일한 방식으로 진행합니다.
- 모든 변경은 **Git → ArgoCD → Kubernetes** 흐름을 따릅니다.
- 직접 수정 X → **GitOps**를 사용해주세요!

---

## 💪 전체 배포 요약

**Terraform으로 AWS 인프라 생성**
→ **EKS 클러스터 접속 설정**
→ **Kubernetes 기본 리소스 생성** (NS / Secret / ALB Controller)
→ **ArgoCD 설치**
→ **Helm values에 인프라 정보 반영** ← Terraform Output
→ **Git Push**
→ **ArgoCD가 자동으로 서비스 배포**
→ **검증 / 운영**

---

## 1. 환경 정의 및 운영 원칙

### 1.1 환경 구성

| 환경     | 목적        | 클러스터 이름     | 네임스페이스 | 특징                     |
| -------- | ----------- | ----------------- | ------------ | ------------------------ |
| **dev**  | 개발/테스트 | `passit-dev-eks`  | `services`   | 개발자 테스트, 기능 검증 |
| **prod** | 프로덕션    | `passit-prod-eks` | `services`   | 실제 서비스 운영         |
| **dr**   | 재해 복구   | `passit-dr-eks`   | `services`   | 재해 복구 대비           |

### 1.2 트래픽 흐름

```
Client → ALB (HTTPS) → EKS Ingress Controller → Application Pod → RDS / Valkey / S3
```

### 1.3 서비스 구성

| 서비스              | 포트 | 역할             | 의존성          |
| ------------------- | ---- | ---------------- | --------------- |
| **account-service** | 8081 | 사용자 계정 관리 | RDS, Valkey, S3 |
| **ticket-service**  | 8082 | 티켓 관리        | RDS, Valkey, S3 |
| **trade-service**   | 8083 | 거래 관리        | RDS, Valkey     |
| **cs-service**      | 8084 | 고객 지원        | RDS, Valkey     |
| **chat-service**    | 8085 | 채팅 서비스      | RDS, Valkey     |

---

## 2. 전체 배포 흐름

> 💡 **Git 변경 → ArgoCD → Helm → EKS(Pod) → ALB → 사용자**

### 2.1 배포 파이프라인

1. **코드 개발 및 커밋** → GitHub Repository
2. **인프라 배포 (Terraform)** → VPC, EKS, RDS, Valkey, S3, IRSA
3. **Kubernetes 설정** → Namespace, Secrets, ALB Controller
4. **ArgoCD 설치** → GitOps 자동 배포
5. **서비스 배포 (GitOps)** → Helm Values 업데이트 → Git Push → ArgoCD 자동 동기화
6. **배포 검증** → Pod, 헬스체크, ALB, 모니터링 확인

---

## 3. 사전 주의사항(⭐️)

### 3.1 로컬 도구 설치 체크

> ⚠️ **terraform 버전 안 맞으면 state / provider 오류 발생할 수 있음**

```bash
terraform version  # v1.13.5 이상 권장
aws --version      # v2.31.20 이상
kubectl version    # v1.32.2 이상
helm version       # v4.0.0 이상
argocd version     # v3.2.2 이상 (선택)
yq --version       # yq 설치 권장 (Helm values 업데이트용)
```

**yq 설치**:

```bash
brew install yq  # macOS
```

### 3.2 AWS 권한 체크

- [ ] AWS IAM 권한 보유 확인
- [ ] GitHub PAT (`packages:read`) 준비
- [ ] GHCR 이미지 Pull 가능 여부 확인

### 3.3 Terraform Backend 설정 (중요! ⭐️)

- [ ] **S3 Backend Bucket 생성** (Terraform State 저장용)
- [ ] **DynamoDB Table 생성** (State Lock용)
- [ ] **여러 명이 동시 작업 시 필수!** → State 충돌 방지

---

## 4. 배포 단계

### 0) Terraform Backend 설정 (필수! ⭐️)

> 💡 **여러 명이 동시에 작업하는 경우 반드시 먼저 설정해야 합니다!**

#### ⚡ 자동화 스크립트 사용 (권장)

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts
./setup-terraform-backend.sh dev
```

이 스크립트는 다음을 자동으로 수행합니다:

- ✅ S3 Bucket 생성 및 설정 (Versioning, 암호화, Public Access 차단)
- ✅ DynamoDB Table 생성 (State Lock용)

#### 수동 설정

1. **Backend 리소스 생성** (위 스크립트 실행)
2. **backend.tf 파일 주석 해제**
   ```hcl
   # terraform/envs/dev/backend.tf
   terraform {
     backend "s3" {
       bucket         = "passit-terraform-state-dev"
       key            = "dev/terraform.tfstate"
       region         = "ap-northeast-2"
       dynamodb_table = "passit-terraform-locks-dev"
       encrypt        = true
     }
   }
   ```
3. **State 마이그레이션**
   ```bash
   cd /Users/krystal/workspace/Passit/terraform/envs/dev
   terraform init -migrate-state
   ```

> ⚠️ **주의사항**:
>
> - 기존 로컬 state 파일이 있으면 마이그레이션됩니다
> - 마이그레이션 전에 로컬 state 백업 권장: `cp terraform.tfstate terraform.tfstate.backup`
> - 여러 명이 동시에 마이그레이션 금지! (한 명씩 순차적으로)

---

### 1) 인프라 배포 (Terraform)

#### 1.1 환경 변수 설정

```bash
cd /Users/krystal/workspace/Passit/terraform/envs/dev

# terraform.tfvars 파일 확인/생성
cp terraform.tfvars.example terraform.tfvars
vi terraform.tfvars  # 필요한 값 입력
```

#### 1.2 Terraform 초기화 및 배포

```bash
# Terraform 초기화
terraform init

# 배포 계획 확인
terraform plan

# 배포 실행 (약 20-30분 소요)
terraform apply
```

**생성되는 리소스**:

- VPC, Subnet, Security Groups
- EKS Cluster + Node Groups
- RDS Aurora Cluster
- Valkey (ElastiCache)
- S3 Buckets
- IRSA Roles
- Prometheus (AMP), Grafana (AMG)
- CloudWatch Logs, Alarms

---

### 2) EKS 클러스터 접근 설정

#### ⚡ 자동화 스크립트 사용 (권장)

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts
./connect-eks.sh dev
```

#### 수동 설정

```bash
# kubeconfig 업데이트
aws eks update-kubeconfig \
  --name passit-dev-eks \
  --region ap-northeast-2

# 연결 확인
kubectl get nodes
kubectl get namespaces
```

---

### 3) Kubernetes 기본 설정

#### ⚡ 자동화 스크립트 사용 (권장)

```bash
# GitHub PAT 환경 변수 설정
export GITHUB_USERNAME="YOUR_GITHUB_USERNAME"
export GITHUB_PAT="YOUR_GITHUB_PAT"

# 자동화 스크립트 실행
cd /Users/krystal/workspace/Passit/terraform/scripts
./setup-k8s-prerequisites.sh dev
```

이 스크립트는 다음을 자동으로 수행합니다:

- ✅ EKS 클러스터 연결 확인
- ✅ Namespace 생성 (services, argocd)
- ✅ GHCR Pull Secret 생성
- ✅ Database & Valkey Secrets 생성 (모든 서비스)
- ✅ AWS Load Balancer Controller 설치

#### 수동 설정

**3.1 Namespace 생성**

```bash
kubectl create namespace services
kubectl create namespace argocd
```

**3.2 GHCR Pull Secret 생성**

```bash
export GITHUB_USERNAME="YOUR_GITHUB_USERNAME"
export GITHUB_PAT="YOUR_GITHUB_PAT"

kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USERNAME \
  --docker-password=$GITHUB_PAT \
  --namespace=services
```

**3.3 Database & Valkey Secrets 생성**

```bash
cd /Users/krystal/workspace/Passit/terraform/envs/dev
export DB_PASSWORD=$(terraform output -raw rds_master_password)

for service in account ticket trade cs chat; do
  kubectl create secret generic ${service}-secret \
    --namespace=services \
    --from-literal=db.user=admin \
    --from-literal=db.password="$DB_PASSWORD" \
    --from-literal=valkey.password="" \
    --dry-run=client -o yaml | kubectl apply -f -
done
```

**3.4 AWS Load Balancer Controller 설치**

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=passit-dev-eks \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

---

### 4) ArgoCD 설치 및 설정

#### Option A: Terraform으로 자동 설치 (권장) ⚡

Terraform의 `modules/cicd` 모듈이 ArgoCD를 Helm으로 자동 설치합니다.

```bash
# Terraform apply 시 자동으로 ArgoCD가 설치됨
cd /Users/krystal/workspace/Passit/terraform/envs/dev
terraform apply

# 설치 확인
kubectl get pods -n argocd
kubectl get ingress -n argocd  # ALB Ingress 확인
```

#### Option B: 수동 설치

```bash
# ArgoCD 설치
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 설치 확인 (약 2-3분 소요)
kubectl get pods -n argocd -w
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
```

**4.1 ArgoCD 접근 설정**

```bash
# 초기 admin 비밀번호 확인
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward로 접근
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 브라우저에서 https://localhost:8080 접속
# Username: admin
# Password: (위에서 확인한 비밀번호)
```

**4.2 ArgoCD CLI 설정 (선택사항)**

```bash
brew install argocd  # macOS
argocd login localhost:8080
argocd account update-password
```

---

### 5) Helm Values 업데이트

#### ⚡ 자동화 스크립트 사용 (권장)

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts
./update-helm-values.sh dev
```

이 스크립트는 다음을 자동으로 수행합니다:

- ✅ Terraform output 값 자동 추출
- ✅ 모든 서비스의 `values-dev.yaml` 파일 자동 업데이트
- ✅ RDS, Valkey, S3, IRSA Role ARN 자동 반영

**사전 요구사항**: `yq` 설치 권장 (더 정확한 YAML 수정)

#### 수동 업데이트

각 서비스의 `helm/values-dev.yaml` 파일을 수동으로 편집:

- `database.host`: RDS Endpoint
- `redis.host`: Valkey Endpoint
- `s3.bucket`: S3 Bucket ID
- `serviceAccount.annotations.eks.amazonaws.com/role-arn`: IRSA Role ARN

---

### 6) Git Commit & Push

```bash
cd /Users/krystal/workspace/Passit

# 변경사항 확인
git status

# 커밋
git add .
git commit -m "Update Helm values with Terraform outputs for dev environment"

# 푸시
git push origin develop  # 또는 main
```

---

### 7) ArgoCD App of Apps 배포

**7.1 App of Apps 배포**

```bash
kubectl apply -f /Users/krystal/workspace/Passit/terraform/argocd/app-of-apps.yaml

# 상태 확인
kubectl get applications -n argocd
```

**7.2 ArgoCD UI에서 확인**

1. 브라우저에서 `https://localhost:8080` 접속
2. Applications 메뉴에서 `passit-services` 확인
3. 각 서비스 Application 상태 확인:
   - `account-service-dev`
   - `ticket-service-dev`
   - `trade-service-dev`
   - `cs-service-dev`
   - `chat-service-dev`

**7.3 수동 동기화 (필요시)**

```bash
# ArgoCD CLI 사용
argocd app sync passit-services

# 또는 개별 서비스 동기화
argocd app sync account-service-dev
argocd app sync ticket-service-dev
argocd app sync trade-service-dev
argocd app sync cs-service-dev
argocd app sync chat-service-dev
```

---

### 8) 배포 검증

**8.1 Pod 상태 확인**

```bash
# 모든 Pod 상태 확인
kubectl get pods -n services -w

# 특정 서비스 Pod 확인
kubectl get pods -n services -l app=account-service
kubectl get pods -n services -l app=ticket-service
kubectl get pods -n services -l app=trade-service
kubectl get pods -n services -l app=cs-service
kubectl get pods -n services -l app=chat-service
```

**8.2 서비스 확인**

```bash
kubectl get svc -n services
kubectl get ingress -n services
```

**8.3 ALB 주소 확인 및 헬스체크**

```bash
# Account Service
ACCOUNT_ALB=$(kubectl get ingress -n services account-service-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$ACCOUNT_ALB/actuator/health

# Ticket Service
TICKET_ALB=$(kubectl get ingress -n services ticket-service-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$TICKET_ALB/actuator/health

# Trade Service
TRADE_ALB=$(kubectl get ingress -n services trade-service-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$TRADE_ALB/actuator/health

# CS Service
CS_ALB=$(kubectl get ingress -n services cs-service-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$CS_ALB/actuator/health

# Chat Service
CHAT_ALB=$(kubectl get ingress -n services chat-service-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$CHAT_ALB/actuator/health
```

**8.4 로그 확인**

```bash
kubectl logs -n services -l app=account-service --tail=100 -f
kubectl logs -n services -l app=account-service | grep -i error
```

---

### 9) 모니터링 확인

**9.1 Prometheus (AMP) 확인**

```bash
cd /Users/krystal/workspace/Passit/terraform/envs/dev
terraform output prometheus_workspace_endpoint
terraform output prometheus_workspace_arn

# Prometheus Agent Pod 확인
kubectl get pods -n monitoring
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus --tail=50
```

**9.2 Grafana 확인**

```bash
# AWS Console에서 Grafana Workspace 확인
aws grafana list-workspaces --region ap-northeast-2

# Grafana 접근
# AWS Console → Amazon Managed Grafana → Workspace 선택
```

**9.3 CloudWatch Logs 확인**

```bash
# CloudWatch Log Group 확인
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/eks/passit-dev-eks" \
  --region ap-northeast-2

# Fluent Bit Pod 확인
kubectl get pods -n kube-system -l app.kubernetes.io/name=fluent-bit

# 로그 확인
LOG_GROUP="/aws/eks/passit-dev-eks/application"
aws logs tail "$LOG_GROUP" --region ap-northeast-2 --follow
```

**9.4 CloudWatch Alarms 확인**

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "passit-dev" \
  --region ap-northeast-2 \
  --query "MetricAlarms[*].[AlarmName,StateValue]" \
  --output table
```

**9.5 모니터링 통합 확인 체크리스트**

- [ ] Prometheus Agent Pod가 Running 상태
- [ ] Prometheus Agent가 AMP로 메트릭 전송 중
- [ ] Fluent Bit Pod가 Running 상태
- [ ] CloudWatch Logs에 로그 수집 중
- [ ] Grafana Workspace 접근 가능
- [ ] Grafana에서 Prometheus 데이터 소스 연결됨
- [ ] CloudWatch Alarms 정상 작동
- [ ] 애플리케이션 메트릭 수집 확인 (`/actuator/prometheus` 엔드포인트)

---

## 5. 트러블 슈팅

### 5.1 Terraform Backend 관련 문제

**문제**: State Lock 에러

- **증상**: `Error acquiring the state lock`
- **해결**: DynamoDB에서 Lock 항목 삭제 (다른 사람이 작업 중일 수 있으니 주의)

**문제**: Backend 초기화 실패

- **증상**: `terraform init` 실행 시 Backend 연결 실패
- **해결**: `./setup-terraform-backend.sh dev` 재실행 후 `backend.tf` 주석 해제 확인

### 5.2 인프라 관련 문제

**문제**: Terraform Apply 실패

- **해결**: `terraform state list` 확인, 특정 리소스만 재생성: `terraform apply -target=module.eks.aws_eks_cluster.main`

**문제**: EKS 클러스터 접근 불가

**증상**: `AccessDeniedException: User is not authorized to perform: eks:DescribeCluster`

**해결 방법**:

**Option A: Terraform으로 EKS Access Entry 추가 (권장)**

1. `terraform/modules/eks/main.tf` 파일에서 `access_entries`에 사용자 추가:

```hcl
access_entries = {
  iamconan = {
    principal_arn     = "arn:aws:iam::727646470302:user/iamconan"
    type              = "STANDARD"
    policy_associations = {
      admin = {
        policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
        access_scope = {
          type = "cluster"
        }
      }
    }
  }
  t2-krystal = {  # 추가
    principal_arn     = "arn:aws:iam::727646470302:user/t2-krystal"
    type              = "STANDARD"
    policy_associations = {
      admin = {
        policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
        access_scope = {
          type = "cluster"
        }
      }
    }
  }
}
```

2. Terraform apply:

```bash
cd /Users/krystal/workspace/Passit/terraform/envs/dev
terraform apply
```

**Option B: 자동화 스크립트 사용 (권장) ⚡**

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts
./add-eks-access-entry.sh dev t2-krystal
```

**Option C: AWS CLI로 직접 추가 (수동)**

```bash
# EKS Access Entry 생성
aws eks create-access-entry \
  --cluster-name passit-dev-eks \
  --principal-arn arn:aws:iam::727646470302:user/t2-krystal \
  --type STANDARD \
  --region ap-northeast-2

# Admin Policy 연결
aws eks associate-access-policy \
  --cluster-name passit-dev-eks \
  --principal-arn arn:aws:iam::727646470302:user/t2-krystal \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region ap-northeast-2
```

**Option D: IAM 정책에서 Explicit Deny 제거**

IAM 사용자 정책에서 `eks:DescribeCluster`에 대한 `Deny` 정책이 있는지 확인하고 제거:

```bash
# 사용자 정책 확인
aws iam list-user-policies --user-name t2-krystal
aws iam list-attached-user-policies --user-name t2-krystal

# 정책 내용 확인
aws iam get-user-policy --user-name t2-krystal --policy-name <policy-name>
```

**Option E: connect-eks.sh 재실행**

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts
./connect-eks.sh dev
```

### 5.3 Kubernetes 관련 문제

**문제**: Pod가 Pending 상태

- **해결**: `kubectl describe pod <POD_NAME> -n services`로 원인 확인, 노드 리소스 확인

**문제**: ImagePullBackOff 에러

- **해결**: `kubectl get secret ghcr-pull-secret -n services` 확인, Secret 재생성

**문제**: CrashLoopBackOff 에러

- **해결**: `kubectl logs <POD_NAME> -n services --previous`로 로그 확인, DB 연결 확인

**문제**: IRSA 권한 문제

- **해결**: `kubectl get sa -n services account-service-sa -o yaml | grep eks.amazonaws.com/role-arn` 확인

### 5.4 ArgoCD 관련 문제

**문제**: Application이 Sync되지 않음

- **해결**: `argocd app get <app-name>`, `argocd app sync <app-name> --force`

**문제**: Health Check 실패

- **해결**: Pod 상태 확인, 헬스체크 엔드포인트 확인: `curl localhost:8081/actuator/health`

### 5.5 네트워크 관련 문제

**문제**: ALB가 생성되지 않음

- **해결**: `kubectl logs -n kube-system deployment/aws-load-balancer-controller` 확인

**문제**: 서비스 간 통신 실패

- **해결**: Service DNS 확인, `nslookup account-service.services.svc.cluster.local`

### 5.6 데이터베이스 관련 문제

**문제**: RDS 연결 실패

- **해결**: Security Group 확인, Pod에서 연결 테스트: `nc -zv <RDS_ENDPOINT> 5432`

**문제**: Valkey 연결 실패

- **해결**: Security Group 확인, Pod에서 연결 테스트: `nc -zv <VALKEY_ENDPOINT> 6379`

### 5.7 일반적인 디버깅 명령어

```bash
# 모든 리소스 상태 확인
kubectl get all -n services

# 이벤트 확인
kubectl get events -n services --sort-by='.lastTimestamp'

# Pod 상세 정보
kubectl describe pod <POD_NAME> -n services

# 로그 실시간 확인
kubectl logs -n services -l app=account-service -f

# 리소스 사용량 확인
kubectl top pods -n services
kubectl top nodes

# Deployment 롤백
kubectl rollout undo deployment/<SERVICE> -n services
```

---

## 6. 참고 문서

- [ArgoCD App of Apps Pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
- [Terraform README](/Users/krystal/workspace/Passit/terraform/README.md)
- [배포 체크리스트](/Users/krystal/workspace/Passit/terraform/DEPLOYMENT_CHECKLIST.md)
- [서비스 배포 가이드](/Users/krystal/workspace/Passit/terraform/docs/SERVICE_DEPLOYMENT_GUIDE.md)
- [ArgoCD README](/Users/krystal/workspace/Passit/terraform/argocd/README.md)

---

## 📝 스크립트 요약

다음 스크립트들이 배포 과정을 자동화합니다:

| 스크립트                     | 용도                                               | 실행 위치            |
| ---------------------------- | -------------------------------------------------- | -------------------- |
| `setup-terraform-backend.sh` | Terraform Backend 설정 (S3, DynamoDB)              | `terraform/scripts/` |
| `connect-eks.sh`             | EKS 클러스터 접속 설정                             | `terraform/scripts/` |
| `add-eks-access-entry.sh`    | EKS Access Entry 추가 (IAM 사용자 권한 부여)       | `terraform/scripts/` |
| `setup-k8s-prerequisites.sh` | Kubernetes 기본 설정 (NS, Secrets, ALB Controller) | `terraform/scripts/` |
| `update-helm-values.sh`      | Helm Values 자동 업데이트                          | `terraform/scripts/` |

**사용 예시**:

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts

# 1. Backend 설정
./setup-terraform-backend.sh dev

# 2. EKS 접속
./connect-eks.sh dev

# 2-1. EKS 접근 권한 오류 시 (선택)
./add-eks-access-entry.sh dev t2-krystal

# 3. Kubernetes 기본 설정
export GITHUB_USERNAME="your_username"
export GITHUB_PAT="your_pat"
./setup-k8s-prerequisites.sh dev

# 4. Helm Values 업데이트
./update-helm-values.sh dev
```
