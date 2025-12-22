# Terraform Scripts 가이드

배포 자동화를 위한 스크립트 모음입니다.

---

## 📋 스크립트 목록

현재 **4개의 배포 자동화 스크립트**가 있습니다:

| 스크립트                     | 용도                                               | 사용 시점               |
| ---------------------------- | -------------------------------------------------- | ----------------------- |
| `setup-terraform-backend.sh` | Terraform Backend 설정 (S3, DynamoDB)              | 배포 전 필수            |
| `connect-eks.sh`             | EKS 클러스터 접속 설정                             | 인프라 배포 후          |
| `setup-k8s-prerequisites.sh` | Kubernetes 기본 설정 (NS, Secrets, ALB Controller) | EKS 접속 후             |
| `update-helm-values.sh`      | Helm Values 자동 업데이트                          | Helm values 업데이트 시 |

---

## 🚀 사용 방법

### 전체 배포 흐름

```bash
cd /Users/krystal/workspace/Passit/terraform/scripts

# 1. Backend 설정 (최초 1회)
./setup-terraform-backend.sh dev

# 2. EKS 접속
./connect-eks.sh dev

# 3. Kubernetes 기본 설정
export GITHUB_USERNAME="your_username"
export GITHUB_PAT="your_pat"
./setup-k8s-prerequisites.sh dev

# 4. Helm Values 업데이트
./update-helm-values.sh dev
```

---

## 📝 스크립트 상세 설명

### `setup-terraform-backend.sh`

**용도**: Terraform Backend 리소스 생성 (S3 Bucket, DynamoDB Table)

**사용법**:

```bash
./setup-terraform-backend.sh <env>
# 예시: ./setup-terraform-backend.sh dev
```

**생성 리소스**:

- S3 Bucket: `passit-terraform-state-{env}` (Versioning, 암호화, Public Access 차단)
- DynamoDB Table: `passit-terraform-locks-{env}` (State Lock용)

**주의사항**:

- 여러 명이 동시 작업 시 필수
- Backend 설정 후 `backend.tf` 파일 주석 해제 필요
- State 마이그레이션: `terraform init -migrate-state`

---

### `connect-eks.sh`

**용도**: EKS 클러스터 접속 설정

**사용법**:

```bash
./connect-eks.sh <env>
# 예시: ./connect-eks.sh dev
```

**기능**:

- Terraform output에서 클러스터 이름 자동 추출
- kubeconfig 업데이트
- 접속 확인 및 클러스터 정보 출력

---

### `setup-k8s-prerequisites.sh`

**용도**: Kubernetes 기본 리소스 생성

**사용법**:

```bash
export GITHUB_USERNAME="your_username"
export GITHUB_PAT="your_pat"
./setup-k8s-prerequisites.sh <env>
# 예시: ./setup-k8s-prerequisites.sh dev
```

**생성 리소스**:

- Namespace: `services`, `argocd`
- GHCR Pull Secret: `ghcr-pull-secret` (GitHub PAT 필요)
- Database Secrets: 각 서비스별 Secret (account, ticket, trade, cs, chat)
- AWS Load Balancer Controller: Helm으로 설치

**필수 환경 변수**:

- `GITHUB_USERNAME`: GitHub 사용자명
- `GITHUB_PAT`: GitHub Personal Access Token (packages:read 권한)

---

### `update-helm-values.sh`

**용도**: Helm Values 파일 자동 업데이트

**사용법**:

```bash
./update-helm-values.sh <env>
# 예시: ./update-helm-values.sh dev
```

**기능**:

- Terraform output 값 자동 추출 (RDS, Valkey, S3, IRSA Role ARN)
- 모든 서비스의 `values-{env}.yaml` 파일 자동 업데이트
- `values-{env}.yaml`이 없으면 `values.yaml`을 복사하여 생성

**사전 요구사항**:

- `yq` 설치 권장 (더 정확한 YAML 수정)
  ```bash
  brew install yq  # macOS
  ```
- `yq`가 없어도 `sed`로 기본 업데이트 가능

**업데이트되는 값**:

- `database.host`: RDS Endpoint
- `redis.host`: Valkey Endpoint
- `s3.bucket`: S3 Bucket ID (해당 서비스)
- `serviceAccount.annotations.eks.amazonaws.com/role-arn`: IRSA Role ARN

---

## 📊 배포 가이드 연동

이 스크립트들은 [배포 가이드](/Users/krystal/workspace/Passit/DEPLOYMENT_GUIDE.md)의 다음 단계에서 사용됩니다:

- **0단계**: `setup-terraform-backend.sh` - Terraform Backend 설정
- **2단계**: `connect-eks.sh` - EKS 클러스터 접근 설정
- **3단계**: `setup-k8s-prerequisites.sh` - Kubernetes 기본 설정
- **5단계**: `update-helm-values.sh` - Helm Values 업데이트

---

## 💡 팁

### 스크립트 실행 순서

1. **Backend 설정** (최초 1회만)
2. **EKS 접속** (인프라 배포 후)
3. **Kubernetes 기본 설정** (EKS 접속 후)
4. **Helm Values 업데이트** (Terraform output 변경 시)

### 환경 변수 설정

```bash
# GitHub PAT 설정 (Kubernetes 기본 설정 전에)
export GITHUB_USERNAME="your_username"
export GITHUB_PAT="your_pat"
```

### 스크립트 재실행

- 대부분의 스크립트는 **멱등성(idempotent)**을 보장합니다
- 이미 생성된 리소스가 있으면 건너뛰거나 업데이트합니다
- 안전하게 여러 번 실행 가능합니다

---
