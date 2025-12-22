# GitHub Actions Workflows

이 디렉토리는 Passit 프로젝트의 CI/CD 파이프라인을 정의합니다.

## Workflows

### `deploy-dev.yml`

- **트리거**: `develop` 브랜치에 push 또는 수동 실행
- **기능**:
  - Terraform output 값으로 Helm values 자동 업데이트
  - ArgoCD Application 동기화
- **환경**: Dev

### `deploy-prod.yml`

- **트리거**: `main` 브랜치에 push 또는 수동 실행 (확인 필요)
- **기능**:
  - Terraform output 값으로 Helm values 자동 업데이트
  - ArgoCD Application 동기화
- **환경**: Prod

## 사전 설정

### 1. GitHub Secrets 설정

다음 Secrets를 GitHub Repository에 설정해야 합니다:

```bash
# Dev 환경
AWS_ROLE_ARN_DEV=arn:aws:iam::727646470302:role/passit-dev-github-actions

# Prod 환경
AWS_ROLE_ARN_PROD=arn:aws:iam::727646470302:role/passit-prod-github-actions
```

**Terraform output에서 Role ARN 확인:**

```bash
# Dev 환경
cd terraform/envs/dev
terraform output github_actions_role_arn

# Prod 환경
cd terraform/envs/prod
terraform output github_actions_role_arn
```

**참고**: 이 Role은 EKS 배포용이며, frontend 배포용 Role(`github_actions_frontend_role_arn`)과는 별개입니다.

### 2. GitHub OIDC Provider 설정

Terraform에서 GitHub OIDC Provider가 생성되어 있어야 합니다.

```bash
# 확인
aws iam list-open-id-connect-providers
```

### 3. IAM Role 권한 확인

GitHub Actions IAM Role에 다음 권한이 필요합니다:

- `eks:DescribeCluster`
- `eks:UpdateClusterConfig`
- `ssm:StartSession` (ArgoCD 접근용)
- `sts:AssumeRole`

## 사용 방법

### 수동 배포 (Workflow Dispatch)

1. GitHub Repository → Actions 탭
2. "Deploy to Dev Environment" 또는 "Deploy to Prod Environment" 선택
3. "Run workflow" 클릭
4. 서비스 선택 (빈 값이면 모든 서비스)
5. 실행

### 자동 배포 (Push)

- `develop` 브랜치에 push → Dev 환경 자동 배포
- `main` 브랜치에 push → Prod 환경 자동 배포 (확인 필요)

## Workflow 단계

1. **Update Helm Values**: Terraform output에서 값을 가져와서 Helm values 파일 업데이트
2. **Commit Changes**: 변경사항을 Git에 커밋 및 푸시
3. **Trigger ArgoCD Sync**: ArgoCD Application 동기화

## 문제 해결

### IAM Role Assume 실패

```bash
# Role ARN 확인
terraform output github_actions_role_arn

# GitHub Secrets 확인
# Repository Settings → Secrets and variables → Actions
```

### ArgoCD Sync 실패

```bash
# ArgoCD Server 상태 확인
kubectl get pods -n argocd

# ArgoCD CLI 설치 확인
argocd version
```

---

**참고**: 이 workflows는 Terraform에서 생성된 IAM Role을 사용하여 AWS 리소스에 접근합니다.
