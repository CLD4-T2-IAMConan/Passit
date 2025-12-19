# Security Module

Passit 프로젝트의 보안 인프라를 관리하는 Terraform 모듈입니다.

## 📋 목차

- [개요](#개요)
- [구성 요소](#구성-요소)
- [사용 방법](#사용-방법)
- [보안 리소스](#보안-리소스)
- [IAM 역할](#iam-역할)
- [KMS 암호화](#kms-암호화)
- [Secrets Manager](#secrets-manager)
- [Security Groups](#security-groups)
- [IRSA 설정](#irsa-설정)
- [운영 가이드](#운영-가이드)
- [보안 베스트 프랙티스](#보안-베스트-프랙티스)

---

## 개요

이 모듈은 다음과 같은 보안 인프라를 프로비저닝합니다:

- **IAM Roles & Policies**: EKS, CI/CD, 모니터링, 애플리케이션 Pod용 역할
- **KMS Keys**: 암호화 키 (Secrets Manager, RDS, ElastiCache, EBS)
- **Secrets Manager**: 민감한 자격 증명 저장 (DB, OAuth, SMTP, Admin)
- **Security Groups**: 네트워크 보안 규칙 (ALB, EKS, RDS, ElastiCache)
- **IRSA**: Kubernetes Service Account와 IAM Role 연결

## 구성 요소

### 파일 구조

```
terraform/modules/security/
├── README.md                      # 이 문서
├── variables.tf                   # 입력 변수 정의
├── outputs.tf                     # 출력 값 정의
├── iam.tf                         # IAM 역할 및 정책
├── kms.tf                         # KMS 암호화 키
├── secrets-manager.tf             # Secrets Manager 시크릿
├── security-groups.tf             # Security Groups
├── irsa.tf                        # IRSA (IAM Roles for Service Accounts)
├── iam-user-policy.json           # IAM 사용자 정책 예시
└── restore-all-secrets.sh         # 시크릿 복구 스크립트
```

---

## 사용 방법

### 기본 사용

```hcl
module "security" {
  source = "../../modules/security"

  # 필수 변수
  account_id   = "727646470302"
  environment  = "dev"
  region       = "ap-northeast-2"
  project_name = "passit"

  # Network 의존성
  vpc_id = module.network.vpc_id

  # EKS 의존성 (IRSA용)
  # 초기 배포 시: 빈 값으로 설정 (IRSA 리소스 생성 안 됨)
  # EKS 생성 후: 클러스터 이름으로 업데이트하여 재배포 (IRSA 활성화)
  eks_cluster_name = ""

  # 보안 그룹 설정
  allowed_cidr_blocks = ["0.0.0.0/0"]  # Dev: 전체 허용, Prod: 특정 IP만
}
```

### Dev 환경 예시

#### Step 1: 초기 배포 (EKS 생성 전)

```hcl
# terraform/envs/dev/main.tf
module "security" {
  source = "../../modules/security"

  account_id   = var.account_id
  environment  = "dev"
  region       = var.region
  project_name = var.project_name

  vpc_id = module.network.vpc_id

  # EKS 생성 전: 빈 값 (IAM Role만 생성, IRSA는 생성 안 됨)
  eks_cluster_name = var.eks_cluster_name  # terraform.tfvars에서 "" 설정

  allowed_cidr_blocks = ["0.0.0.0/0"]  # 개발 환경은 전체 허용
}
```

#### Step 2: EKS 생성 후 IRSA 활성화

```hcl
# terraform/envs/dev/terraform.tfvars
# EKS 생성 후 아래 값 업데이트
eks_cluster_name = "passit-dev-eks"

# 그 다음 Security 모듈 재배포
# terraform apply -target=module.security
# → IRSA 관련 리소스(OIDC Provider, ServiceAccount용 Role)가 생성됨
```

### Prod 환경 예시

```hcl
# terraform/envs/prod/main.tf
module "security" {
  source = "../../modules/security"

  account_id   = var.account_id
  environment  = "prod"
  region       = var.region
  project_name = var.project_name

  vpc_id = module.network.vpc_id

  # Prod는 EKS와 함께 배포하므로 직접 참조 가능
  eks_cluster_name = var.eks_cluster_name  # terraform.tfvars에 설정

  allowed_cidr_blocks = [
    "123.456.789.0/32",  # 사무실 IP
    "98.76.54.32/32"     # VPN IP
  ]
}
```

```hcl
# terraform/envs/prod/terraform.tfvars
eks_cluster_name = "passit-prod-eks"
```

---

## 보안 리소스

### 리소스 생성 순서

**Phase 1: EKS 생성 전** (eks_cluster_name = "")
1. **KMS Keys** - 암호화 키 생성
2. **Security Groups** - 네트워크 보안 규칙
3. **IAM Roles (기본)** - EKS Cluster, Node Group, GitHub Actions
4. **Secrets Manager** - 초기 시크릿 생성

**Phase 2: EKS 생성 후** (eks_cluster_name = "passit-dev-eks")
5. **IRSA (OIDC Provider)** - EKS OIDC Provider 생성
6. **IAM Roles (IRSA)** - ArgoCD, Prometheus, FluentBit, App Pod

⚠️ **중요**: Security 모듈은 2단계로 배포해야 합니다
- 1차: EKS 없이 기본 리소스만 생성
- 2차: EKS 생성 후 IRSA 리소스 추가 생성

---

## IAM 역할

### 역할 목록

| 역할             | 용도              | 신뢰 관계                           |
| ---------------- | ----------------- | ----------------------------------- |
| `eks_cluster`    | EKS 컨트롤 플레인 | eks.amazonaws.com                   |
| `eks_node_group` | EKS 워커 노드     | ec2.amazonaws.com                   |
| `github_actions` | CI/CD 배포        | token.actions.githubusercontent.com |
| `argocd`         | GitOps 배포       | EKS OIDC Provider                   |
| `prometheus`     | 모니터링          | EKS OIDC Provider                   |
| `fluentbit`      | 로깅              | EKS OIDC Provider                   |
| `app_pod`        | 애플리케이션 Pod  | EKS OIDC Provider                   |

### GitHub Actions 설정 예시

```yaml
# .github/workflows/deploy.yml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: arn:aws:iam::727646470302:role/passit-github-actions-dev
    aws-region: ap-northeast-2
```

### IRSA ServiceAccount 예시

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::727646470302:role/passit-app-pod-dev
```

---

## KMS 암호화

### KMS 키 목록

| KMS Key       | Alias                      | 용도                   | Rotation  |
| ------------- | -------------------------- | ---------------------- | --------- |
| `secrets`     | `passit-secrets-{env}`     | Secrets Manager 암호화 | ✅ 활성화 |
| `rds`         | `passit-rds-{env}`         | Aurora RDS 암호화      | ✅ 활성화 |
| `elasticache` | `passit-elasticache-{env}` | ElastiCache 암호화     | ✅ 활성화 |
| `ebs`         | `passit-ebs-{env}`         | EBS 볼륨 암호화        | ✅ 활성화 |

모든 KMS 키는 다음 설정을 사용합니다:

- **Deletion Window**: 7일 (실수로 삭제 방지)
  - ⚠️ **주의**: KMS 키 삭제 시 7일 동안 "pending deletion" 상태
  - 이 기간 동안 동일한 Alias로 새 키 생성 불가
  - 해결: `aws kms cancel-key-deletion --key-id <key-id>`로 복구
- **Key Rotation**: 자동 활성화 (1년마다 자동 교체)
- **암호화 알고리즘**: AES-256

---

## Secrets Manager

### 시크릿 목록

| 시크릿 이름                            | 설명                       | 키 목록                                                         |
| -------------------------------------- | -------------------------- | --------------------------------------------------------------- |
| `passit/{env}/db`                      | RDS 데이터베이스 자격 증명 | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`       |
| `passit/{env}/smtp`                    | SMTP 이메일 자격 증명      | `MAIL_USERNAME`, `MAIL_PASSWORD`                                |
| `passit/{env}/kakao`                   | Kakao OAuth 자격 증명      | `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_ADMIN_KEY`  |
| `passit/{env}/admin`                   | 초기 관리자 계정           | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_NICKNAME` |
| `passit/{env}/app/secrets`             | 애플리케이션 시크릿        | `jwt_secret`, `api_key`                                         |
| `passit/elasticache/credentials/{env}` | ElastiCache 인증 토큰      | `auth_token`                                                    |

⚠️ **복구 기간**: 모든 시크릿은 삭제 후 7일(Dev) ~ 30일(Prod) 동안 복구 가능

- 이 기간 동안 동일한 이름으로 새 시크릿 생성 불가
- 해결: `aws secretsmanager restore-secret --secret-id <secret-id>`로 복구

### 시크릿 값 조회

```bash
# JSON 형식으로 조회
aws secretsmanager get-secret-value \
  --secret-id passit/dev/db \
  --query SecretString \
  --output text | jq .

# 특정 필드만 조회
aws secretsmanager get-secret-value \
  --secret-id passit/dev/db \
  --query SecretString \
  --output text | jq -r '.DB_HOST'
```

### 시크릿 업데이트

```bash
# JSON 파일로 업데이트
aws secretsmanager put-secret-value \
  --secret-id passit/dev/db \
  --secret-string file://db-secrets.json

# 직접 JSON 입력
aws secretsmanager put-secret-value \
  --secret-id passit/dev/smtp \
  --secret-string '{"MAIL_USERNAME":"smtp@gmail.com","MAIL_PASSWORD":"app_password"}'
```

---

## Security Groups

### 보안 그룹 목록

| Security Group | 허용 규칙                            | 용도               |
| -------------- | ------------------------------------ | ------------------ |
| `alb`          | HTTP(80), HTTPS(443) from 0.0.0.0/0  | ALB 인터넷 접근    |
| `eks_worker`   | 8081-8085 from ALB SG, All from self | EKS 워커 노드      |
| `rds`          | 3306 from EKS Worker SG              | Aurora MySQL       |
| `elasticache`  | 6379 from EKS Worker SG              | ElastiCache Valkey |

### 서비스 포트 매핑

- `8081`: service-account
- `8082`: service-ticket
- `8083`: service-trade
- `8084`: service-chat
- `8085`: service-cs

### 보안 그룹 의존성

```
ALB SG ──▶ EKS Worker SG ──▶ RDS SG
                        └──▶ ElastiCache SG
```

---

## IRSA 설정

### IRSA란?

**IRSA (IAM Roles for Service Accounts)**: Kubernetes ServiceAccount와 AWS IAM Role을 연결하여 Pod이 AWS 리소스에 안전하게 접근할 수 있도록 하는 메커니즘입니다.

### 동작 원리

```
1. Pod 생성
   ↓
2. ServiceAccount 연결 (annotation으로 IAM Role 지정)
   ↓
3. EKS가 Pod에 OIDC Token 주입
   ↓
4. Pod → AWS STS (AssumeRoleWithWebIdentity)
   ↓
5. STS가 OIDC Token 검증 (EKS OIDC Provider)
   ↓
6. Temporary Credentials 발급
   ↓
7. Pod → AWS Services (Secrets Manager, S3 등)
```

### IRSA 설정 단계

#### 1. ServiceAccount 생성 (Kubernetes)

```yaml
# k8s/serviceaccounts/app-service-account.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::727646470302:role/passit-app-pod-dev
```

#### 2. Pod에서 ServiceAccount 사용

```yaml
# k8s/deployments/service-account.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: service-account
spec:
  template:
    spec:
      serviceAccountName: app-service-account
      containers:
        - name: app
          image: passit/service-account:latest
```

#### 3. 애플리케이션 코드에서 AWS SDK 사용

```java
// Spring Boot Application
@Bean
public SecretsManagerClient secretsManagerClient() {
    return SecretsManagerClient.builder()
        .region(Region.AP_NORTHEAST_2)
        // IRSA로 자동 인증 (별도 credentials 불필요)
        .build();
}
```

---

## 운영 가이드

### 초기 설정

#### Step 1: Network 및 Security 모듈 초기 배포 (EKS 생성 전)

```bash
cd terraform/envs/dev

# terraform.tfvars 확인 - eks_cluster_name이 빈 값인지 확인
grep eks_cluster_name terraform.tfvars
# 출력: eks_cluster_name = ""  # ✅ 빈 값이어야 함

# 1. Network 모듈 먼저 배포 (VPC, Subnet, NAT Gateway 등)
terraform apply -target=module.network

# 2. Security 모듈 배포 (IAM Role, KMS, Secrets Manager, Security Groups만 생성)
#    주의: IRSA 관련 리소스는 생성되지 않음 (eks_cluster_name이 빈 값이므로)
terraform apply -target=module.security

# 생성된 리소스 확인
terraform state list | grep "module.security"
# 출력 예시:
# - module.security.aws_kms_key.secrets
# - module.security.aws_kms_key.rds
# - module.security.aws_secretsmanager_secret.db
# - module.security.aws_iam_role.github_actions
# - module.security.aws_security_group.alb
#
# ❌ OIDC Provider나 IRSA 관련 리소스는 없음 (정상)
```

#### Step 2: EKS 클러스터 배포

```bash
# Network, Security 모듈이 이미 배포된 상태에서 EKS 배포
terraform apply -target=module.eks

# EKS 클러스터 이름 확인
terraform output -json | jq '.cluster_name.value'
# 출력: "passit-dev-eks"
```

#### Step 3: IRSA 활성화 (EKS 생성 후)

```bash
# 1. EKS 클러스터 이름 확인 (Step 2에서 생성된 값)
terraform output -json | jq '.cluster_name.value'
# 출력: "passit-dev-eks"

# 2. terraform.tfvars 파일 편집
vi terraform.tfvars
# 다음 줄을 찾아서 수정:
# 변경 전: eks_cluster_name = ""
# 변경 후: eks_cluster_name = "passit-dev-eks"

# 3. 변경사항 확인
grep eks_cluster_name terraform.tfvars
# 출력: eks_cluster_name = "passit-dev-eks"  # ✅ EKS 클러스터 이름 설정됨

# 4. terraform plan으로 추가될 리소스 확인
terraform plan -target=module.security
# 출력 예시:
#   + module.security.aws_iam_openid_connect_provider.eks[0]
#   + module.security.data.aws_eks_cluster.main[0]
#
# ✅ IRSA 관련 리소스가 추가됨을 확인

# 5. Security 모듈 재배포 (IRSA 리소스 생성)
terraform apply -target=module.security

# 6. OIDC Provider 생성 확인
aws iam list-open-id-connect-providers | grep passit-dev-eks
# 출력 예시: "arn:aws:iam::123456789012:oidc-provider/oidc.eks.ap-northeast-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE"

# 7. 생성된 IRSA IAM Role 확인
terraform state list | grep "module.security.aws_iam_role"
# 출력 예시:
# - module.security.aws_iam_role.argocd
# - module.security.aws_iam_role.prometheus
# - module.security.aws_iam_role.fluentbit
# - module.security.aws_iam_role.app_pod
# - module.security.aws_iam_role.github_actions
```

#### Step 4: Secrets Manager 값 업데이트 (RDS 생성 후)

```bash
# RDS 엔드포인트 확인
terraform output -json | jq '.db_endpoint.value'

# Secrets Manager 업데이트
aws secretsmanager put-secret-value \
  --secret-id passit/dev/db \
  --secret-string '{
    "DB_HOST": "passit-dev-aurora.cluster-xxx.ap-northeast-2.rds.amazonaws.com",
    "DB_PORT": "3306",
    "DB_NAME": "passit",
    "DB_USER": "admin",
    "DB_PASSWORD": "SecurePassword123!"
  }'
```

### 시크릿 관리

```bash
# 모든 시크릿 목록
aws secretsmanager list-secrets \
  --filters Key=name,Values=passit/ \
  --output table

# 시크릿 값 조회
aws secretsmanager get-secret-value \
  --secret-id passit/dev/db \
  --query SecretString --output text | jq .

# 시크릿 복구 (삭제 후 7일 이내)
aws secretsmanager restore-secret \
  --secret-id passit/dev/db
```

### 문제 해결

#### ⚠️ 문제 1: EKS 클러스터를 찾을 수 없음

**증상**:
```bash
terraform apply -target=module.security

Error: reading EKS Cluster (passit-dev-eks): couldn't find resource
  with module.security.data.aws_eks_cluster.main[0],
  on ../../modules/security/irsa.tf line 5, in data "aws_eks_cluster" "main":
   5: data "aws_eks_cluster" "main" {
```

**원인**:
- Security 모듈을 EKS보다 먼저 배포하려고 시도
- `irsa.tf`에서 EKS 클러스터 data source를 조회하려고 함
- `eks_cluster_name` 변수에 값이 설정되어 있으면 EKS 조회 시도

**해결**:
```bash
# terraform.tfvars 확인
cat terraform/envs/dev/terraform.tfvars | grep eks_cluster_name

# eks_cluster_name이 빈 값("")이어야 함
eks_cluster_name = ""  # ✅ 올바름
# eks_cluster_name = "passit-dev-eks"  # ❌ EKS 생성 전에는 안 됨

# 올바른 순서:
# 1. Network 모듈 배포
terraform apply -target=module.network

# 2. Security 모듈 배포 (eks_cluster_name = "")
terraform apply -target=module.security

# 3. EKS 모듈 배포
terraform apply -target=module.eks

# 4. terraform.tfvars 업데이트
# eks_cluster_name = "passit-dev-eks"

# 5. Security 모듈 재배포 (IRSA 활성화)
terraform apply -target=module.security
```

#### ⚠️ 문제 2: 삭제 대기 중인 리소스로 인한 재생성 실패

**증상**:

```bash
terraform apply

# Secrets Manager 오류
Error: creating Secrets Manager Secret (passit/dev/db):
InvalidRequestException: You can't create this secret because a secret
with this name is already scheduled for deletion.

# KMS 오류
Error: creating KMS Key: AlreadyExistsException:
Alias alias/passit-secrets-dev already exists.
```

**원인**:

- Secrets Manager: 삭제 후 7일 복구 기간 (recovery_window_in_days = 7)
- KMS Key: 삭제 후 7일 대기 기간 (deletion_window_in_days = 7)
- 이 기간 동안 동일한 이름/별칭으로 새 리소스 생성 불가

#### ✅ 해결 방법

**방법 1: 삭제 대기 중인 리소스 복구 (권장)**

```bash
# 1. Secrets Manager 복구
# 모든 삭제 예정 시크릿 확인
aws secretsmanager list-secrets \
  --filters Key=all,Values=deleted \
  --query 'SecretList[*].[Name,DeletedDate]' \
  --output table

# 개별 시크릿 복구
aws secretsmanager restore-secret --secret-id passit/dev/db
aws secretsmanager restore-secret --secret-id passit/dev/smtp
aws secretsmanager restore-secret --secret-id passit/dev/kakao
aws secretsmanager restore-secret --secret-id passit/dev/admin
aws secretsmanager restore-secret --secret-id passit/dev/app/secrets
aws secretsmanager restore-secret --secret-id passit/elasticache/credentials/dev

# 2. KMS Key 복구
# 삭제 예정 KMS 키 확인
aws kms list-keys --query 'Keys[*].KeyId' --output text | \
while read key; do
  aws kms describe-key --key-id $key --query 'KeyMetadata.[KeyId,KeyState,DeletionDate]' --output table
done

# KMS 키 삭제 취소
aws kms cancel-key-deletion --key-id <key-id>

# Alias로 Key ID 찾기
KEY_ID=$(aws kms list-aliases \
  --query "Aliases[?AliasName=='alias/passit-secrets-dev'].TargetKeyId" \
  --output text)

# 삭제 취소
aws kms cancel-key-deletion --key-id $KEY_ID
```

**방법 2: 즉시 삭제 (주의 필요)**

```bash
# ⚠️ 경고: 복구 불가능한 삭제 - 프로덕션에서는 절대 사용 금지!

# Secrets Manager 즉시 삭제 (복구 불가)
aws secretsmanager delete-secret \
  --secret-id passit/dev/db \
  --force-delete-without-recovery

# KMS는 즉시 삭제 불가 (최소 7일 대기)
# 대신 새로운 Alias 사용
```

**방법 3: Terraform import로 기존 리소스 연결**

```bash
# 1. Secrets Manager import
terraform import module.security.aws_secretsmanager_secret.db \
  passit/dev/db

terraform import module.security.aws_secretsmanager_secret_version.db \
  "passit/dev/db|$(aws secretsmanager describe-secret --secret-id passit/dev/db --query VersionIdsToStages --output json | jq -r 'keys[0]')"

# 2. KMS Key import
terraform import module.security.aws_kms_key.secrets \
  <key-id>

terraform import module.security.aws_kms_alias.secrets \
  alias/passit-secrets-dev
```

**방법 4: 복구 스크립트 사용**

```bash
# 모든 시크릿 복구
cd terraform/modules/security
./restore-all-secrets.sh dev

# 스크립트 내용 확인
cat restore-all-secrets.sh
```

#### 📝 베스트 프랙티스

**개발 환경 (Dev)**:

```hcl
# terraform/modules/security/secrets-manager.tf
resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/${var.environment}/db"
  recovery_window_in_days = 0  # Dev는 즉시 삭제 가능하도록 설정
  # ...
}
```

**프로덕션 환경 (Prod)**:

```hcl
# terraform/modules/security/secrets-manager.tf
resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/${var.environment}/db"
  recovery_window_in_days = 30  # Prod는 30일 복구 기간 (안전)
  # ...
}
```

**환경별 분기 처리**:

```hcl
resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/${var.environment}/db"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
  # ...
}
```

---

## 보안 베스트 프랙티스

### ✅ DO

1. **최소 권한 원칙**

   - IAM Role에 필요한 최소한의 권한만 부여
   - Resource 단위로 권한 제한 (wildcard `*` 지양)

2. **암호화 활성화**

   - 모든 민감 데이터는 KMS로 암호화
   - Secrets Manager, RDS, ElastiCache, EBS 암호화 필수

3. **키 교체 활성화**

   - KMS 자동 키 교체 활성화 (1년)
   - Secrets Manager 주기적 교체 (30일 권장)

4. **네트워크 격리**

   - RDS, ElastiCache는 Private Subnet에만 배치
   - Security Group으로 최소 필요 포트만 개방

5. **IRSA 사용**
   - Pod에 직접 credentials 주입 금지
   - ServiceAccount로 IAM Role 연결

### ❌ DON'T

1. **평문 저장 금지**

   - 환경 변수에 비밀번호 직접 저장 금지
   - ConfigMap에 민감 정보 저장 금지

2. **과도한 권한 부여 금지**

   - `AdministratorAccess` 정책 사용 금지
   - `Resource: "*"` 최소화

3. **Public 접근 금지**

   - RDS, ElastiCache Public Subnet 배치 금지
   - Security Group에 `0.0.0.0/0` 최소화 (ALB 제외)

4. **하드코딩 금지**
   - 소스 코드에 API 키, 비밀번호 하드코딩 금지
   - Git에 credentials 커밋 금지

### 보안 체크리스트

#### 배포 전

- [ ] 모든 시크릿 값이 "CHANGE_ME_IN_PRODUCTION"에서 변경됨
- [ ] KMS 키 교체 활성화 확인
- [ ] IAM Role Trust Policy 검토
- [ ] Security Group 규칙 최소화
- [ ] Prod 환경 allowed_cidr_blocks 특정 IP로 제한

#### 배포 후

- [ ] CloudTrail 로깅 활성화
- [ ] Secrets Manager 접근 로그 확인
- [ ] IAM Access Analyzer 스캔
- [ ] Security Group 미사용 규칙 제거
- [ ] VPC Flow Logs 활성화

---

## Outputs

Security 모듈 출력값:

### IAM Roles

- `eks_cluster_role_arn`
- `eks_node_group_role_arn`
- `github_actions_role_arn`
- `argocd_role_arn`, `prometheus_role_arn`, `fluentbit_role_arn`, `app_pod_role_arn`

### KMS Keys

- `secrets_kms_key_id`, `secrets_kms_key_arn`
- `rds_kms_key_id`, `rds_kms_key_arn`
- `elasticache_kms_key_id`, `elasticache_kms_key_arn`
- `ebs_kms_key_id`, `ebs_kms_key_arn`

### Secrets Manager

- `db_secret_arn`, `smtp_secret_arn`, `kakao_secret_arn`
- `admin_secret_arn`, `app_secret_arn`, `elasticache_secret_arn`

### Security Groups

- `alb_security_group_id`, `eks_worker_security_group_id`
- `rds_security_group_id`, `elasticache_security_group_id`
