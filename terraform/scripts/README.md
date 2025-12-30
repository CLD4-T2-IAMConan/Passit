# Terraform Scripts 가이드

배포 자동화를 위한 스크립트 모음입니다.

---

## 🪟 Windows 사용자 가이드

### Windows에서 스크립트 실행 방법

#### 옵션 1: 배치 파일 사용 (권장)

Windows 사용자를 위한 전용 배치 파일이 제공됩니다:

```cmd
REM EKS 접속
terraform\scripts\connect-eks.bat dev
```

#### 옵션 2: Git Bash 사용

Git Bash를 사용하는 경우:

```bash
./terraform/scripts/connect-eks.sh dev
```

### Windows 문제 해결

#### 1. "No outputs found" 에러

**원인**: Terraform state 초기화 문제 또는 S3 backend 접근 권한 문제

**해결 방법**:
```bash
cd terraform/envs/dev
terraform init -reconfigure
terraform output  # 정상 작동 확인
```

#### 2. 창이 바로 닫히는 문제

**원인**: 스크립트 실행 중 에러 또는 CRLF 줄바꿈 문제

**해결 방법**:
- **배치 파일 사용** (`connect-eks.bat`) - 에러 메시지 확인 가능
- **Git Bash에서 직접 실행**: `bash ./terraform/scripts/connect-eks.sh dev`

#### 3. 줄바꿈 문자 (CRLF) 에러

**원인**: Git이 윈도우에서 자동으로 CRLF로 변환

**해결 방법**:
```bash
# 프로젝트 루트에서 파일 정규화
git add --renormalize .

# 특정 파일만 다시 체크아웃
cd terraform/scripts
git checkout -- connect-eks.sh
```

#### 4. 권한 문제

**해결 방법**:
```bash
# Git Bash에서
chmod +x terraform/scripts/*.sh
```

---

## 📋 스크립트 목록

현재 **7개의 배포 자동화 스크립트**가 있습니다:

| 스크립트                     | 용도                                               | 사용 시점               |
| ---------------------------- | -------------------------------------------------- | ----------------------- |
| `setup-terraform-backend.sh` | Terraform Backend 설정 (S3, DynamoDB)              | 배포 전 필수            |
| `connect-eks.sh`             | EKS 클러스터 접속 설정                             | 인프라 배포 후          |
| `add-eks-user.sh`            | **EKS Access Entry 빠른 추가 (권장)**              | 신규 팀원 온보딩 시     |
| `add-eks-access-entry.sh`    | EKS Access Entry 추가 (레거시)                     | EKS 접근 권한 오류 시   |
| `setup-k8s-prerequisites.sh` | Kubernetes 기본 설정 (NS, Secrets, ALB Controller) | EKS 접속 후             |
| `update-helm-values.sh`      | Helm Values 자동 업데이트                          | Helm values 업데이트 시 |
| `connect-bastion-rds.sh`     | Bastion을 통한 RDS 접속 (Session Manager)          | 로컬 개발 시            |
| `connect-bastion-redis.sh`   | Bastion을 통한 Redis 접속 (Session Manager)        | 로컬 개발 시            |

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

### `add-eks-user.sh` (권장)

**용도**: IAM 사용자에게 EKS 클러스터 접근 권한을 빠르게 부여하는 개선된 스크립트

**사용법**:

```bash
./add-eks-user.sh <IAM_USER_ARN> [POLICY_TYPE]
# 예시: ./add-eks-user.sh arn:aws:iam::727646470302:user/t2-alice
# 예시: ./add-eks-user.sh arn:aws:iam::727646470302:user/t2-bob view
```

**권한 타입**:

| Type    | Policy                          | 설명                   |
| ------- | ------------------------------- | ---------------------- |
| `admin` | AmazonEKSClusterAdminPolicy     | 클러스터 전체 관리자   |
| `edit`  | AmazonEKSEditPolicy             | 리소스 생성/수정 가능  |
| `view`  | AmazonEKSViewPolicy             | 조회만 가능 (Read-only)|

**기능**:

- 사용자 친화적인 인터페이스 (색상 코드, 진행 상황 표시)
- Access Entry 존재 여부 자동 확인
- 기존 Policy 자동 교체 (업데이트 시)
- 상세한 결과 출력 및 다음 단계 안내
- 에러 핸들링 및 롤백 지원

**add-eks-access-entry.sh와의 차이점**:

- ✅ IAM ARN을 직접 입력 (환경 이름 불필요)
- ✅ 권한 타입 선택 가능 (admin/edit/view)
- ✅ 기존 Policy 자동 교체
- ✅ 더 나은 UX (색상, 확인 메시지)

**사용 시나리오**:

- 신규 팀원 온보딩
- 팀원 권한 변경 (admin → view 등)
- 긴급한 접근 권한 부여

**다음 단계 안내**:

스크립트 실행 후 팀원에게 다음을 안내합니다:

```bash
# kubeconfig 설정
aws eks update-kubeconfig --name passit-dev-eks --region ap-northeast-2

# 접근 확인
kubectl get nodes
```

**참고 문서**:
- [EKS Access 설정 가이드](../docs/EKS_ACCESS_SETUP_GUIDE.md)
- [팀원용 빠른 시작](../docs/QUICK_START_FOR_TEAM.md)

---

### `add-eks-access-entry.sh` (레거시)

**용도**: IAM 사용자에게 EKS 클러스터 접근 권한 부여

**사용법**:

```bash
./add-eks-access-entry.sh <env> <iam-user> [region]
# 예시: ./add-eks-access-entry.sh dev t2-krystal
# 예시: ./add-eks-access-entry.sh dev t2-krystal ap-northeast-2
```

**기능**:

- Terraform output에서 클러스터 이름 자동 추출
- EKS Access Entry 생성
- Admin Policy 자동 연결
- 기존 Entry 확인 및 업데이트 지원

**사용 시나리오**:

- `eks:DescribeCluster` 권한 오류 발생 시
- 새로운 팀원에게 EKS 접근 권한 부여 시
- IAM 사용자 권한 변경 시

**주의사항**:

- AWS CLI 권한 필요 (`eks:CreateAccessEntry`, `eks:AssociateAccessPolicy`)
- Terraform 코드에도 추가하는 것을 권장 (GitOps 원칙)

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

### `connect-bastion-rds.sh`

**용도**: Bastion Host를 통한 RDS 접속 (Session Manager Port Forwarding)

**사용법**:

```bash
./connect-bastion-rds.sh <env> [region] [local-port]
# 예시: ./connect-bastion-rds.sh dev
# 예시: ./connect-bastion-rds.sh prod ap-northeast-2 13306
```

**기능**:

- Terraform output에서 Bastion Instance ID 자동 추출
- Terraform output에서 RDS Endpoint 자동 추출
- Session Manager Plugin 설치 확인
- 포트 충돌 자동 감지 및 처리
- MySQL 클라이언트 접속 명령어 안내

**사전 요구사항**:

- Session Manager Plugin 설치
  ```bash
  brew install --cask session-manager-plugin  # macOS
  ```
- AWS CLI 권한 (`ssm:StartSession`)

**사용 예시**:

```bash
# dev 환경 RDS 접속
./connect-bastion-rds.sh dev

# 새 터미널에서 MySQL 접속
mysql -h 127.0.0.1 -P 3306 -u admin -p
```

---

### `connect-bastion-redis.sh`

**용도**: Bastion Host를 통한 ElastiCache (Valkey/Redis) 접속 (Session Manager Port Forwarding)

**사용법**:

```bash
./connect-bastion-redis.sh <env> [region] [local-port]
# 예시: ./connect-bastion-redis.sh dev
# 예시: ./connect-bastion-redis.sh prod ap-northeast-2 16379
```

**기능**:

- Terraform output에서 Bastion Instance ID 자동 추출
- Terraform output에서 Valkey Endpoint 자동 추출
- Session Manager Plugin 설치 확인
- 포트 충돌 자동 감지 및 처리
- Redis CLI 접속 명령어 안내

**사전 요구사항**:

- Session Manager Plugin 설치
  ```bash
  brew install --cask session-manager-plugin  # macOS
  ```
- AWS CLI 권한 (`ssm:StartSession`)

**사용 예시**:

```bash
# dev 환경 Redis 접속
./connect-bastion-redis.sh dev

# 새 터미널에서 Redis 접속
redis-cli -h localhost -p 6379
> PING
PONG
```

---

## 📊 배포 가이드 연동

이 스크립트들은 [배포 가이드](/Users/krystal/workspace/Passit/DEPLOYMENT_GUIDE.md)의 다음 단계에서 사용됩니다:

- **0단계**: `setup-terraform-backend.sh` - Terraform Backend 설정
- **2단계**: `connect-eks.sh` - EKS 클러스터 접근 설정
- **2-1단계**: `add-eks-access-entry.sh` - EKS 접근 권한 오류 시 (선택)
- **3단계**: `setup-k8s-prerequisites.sh` - Kubernetes 기본 설정
- **5단계**: `update-helm-values.sh` - Helm Values 업데이트

---

## 💡 팁

### 스크립트 실행 순서

1. **Backend 설정** (최초 1회만)
2. **EKS 접속** (인프라 배포 후)
3. **EKS Access Entry 추가** (접근 권한 오류 시, 선택)
4. **Kubernetes 기본 설정** (EKS 접속 후)
5. **Helm Values 업데이트** (Terraform output 변경 시)

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
