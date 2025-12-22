# CI/CD 자동화 설정 가이드

## ✅ 현재 설정 상태

### 1. GitHub Actions Workflow
- ✅ `deploy-dev.yml`: develop 브랜치 push 시 자동 실행
- ✅ `deploy-prod.yml`: main 브랜치 push 시 자동 실행
- ✅ Helm values 자동 업데이트
- ✅ ArgoCD 자동 동기화

### 2. ArgoCD 설정
- ✅ **Automated Sync 활성화**: 모든 서비스에 `syncPolicy.automated` 설정됨
- ✅ **Self-Heal 활성화**: Git과 클러스터 상태 자동 동기화
- ✅ **App of Apps 패턴**: `passit-services` Application이 모든 서비스 관리

## 🔄 CI/CD 자동화 흐름

### Dev 환경 (develop 브랜치)

```
1. 코드 변경 → develop 브랜치에 push
   ↓
2. GitHub Actions 자동 실행 (deploy-dev.yml)
   ↓
3. Terraform output으로 Helm values 업데이트
   ↓
4. Git commit & push (자동)
   ↓
5. ArgoCD가 Git 변경 감지 (3분 이내)
   ↓
6. ArgoCD 자동 Sync (automated: true)
   ↓
7. Kubernetes에 배포 완료
```

### Prod 환경 (main 브랜치)

```
1. 코드 변경 → main 브랜치에 push
   ↓
2. GitHub Actions 자동 실행 (deploy-prod.yml)
   ↓
3. Terraform output으로 Helm values 업데이트
   ↓
4. Git commit & push (자동)
   ↓
5. ArgoCD가 Git 변경 감지 (3분 이내)
   ↓
6. ArgoCD 자동 Sync (automated: true)
   ↓
7. Kubernetes에 배포 완료
```

## ⚙️ 사전 설정 필요 사항

### 1. GitHub Secrets 설정 (필수!)

GitHub Repository → Settings → Secrets and variables → Actions

다음 Secrets를 추가해야 합니다:

```bash
# Dev 환경
AWS_ROLE_ARN_DEV=arn:aws:iam::727646470302:role/passit-github-actions-dev

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

### 2. ArgoCD Git Repository 접근 권한

ArgoCD가 GitHub Repository에 접근할 수 있어야 합니다.

**Public Repository**: 별도 설정 불필요

**Private Repository**: 
- GitHub Personal Access Token 필요
- ArgoCD에 Repository 추가 필요

```bash
# ArgoCD CLI로 Repository 추가
argocd repo add https://github.com/CLD4-T2-IAMConan/Passit.git \
  --type git \
  --username <GITHUB_USERNAME> \
  --password <GITHUB_PAT>
```

### 3. GitHub OIDC Provider 설정

Terraform에서 GitHub OIDC Provider가 생성되어 있어야 합니다.

```bash
# 확인
aws iam list-open-id-connect-providers
```

## 🚀 자동화 작동 확인

### 1. GitHub Actions 실행 확인

```bash
# GitHub Repository → Actions 탭에서 확인
# develop 브랜치에 push하면 자동으로 실행됨
```

### 2. ArgoCD 자동 Sync 확인

```bash
# ArgoCD UI에서 확인
# 또는 CLI로 확인
kubectl get applications -n argocd
argocd app get account-service-dev
```

### 3. 배포 상태 확인

```bash
# Pod 상태 확인
kubectl get pods -n services

# ArgoCD Application 상태
kubectl get applications -n argocd
```

## 🔍 문제 해결

### GitHub Actions가 실행되지 않음

1. **Secrets 확인**
   - Repository Settings → Secrets and variables → Actions
   - `AWS_ROLE_ARN_DEV`, `AWS_ROLE_ARN_PROD` 확인

2. **Workflow 파일 경로 확인**
   - `.github/workflows/deploy-dev.yml` 존재 확인
   - `develop` 브랜치에 파일이 있는지 확인

3. **트리거 조건 확인**
   - `develop` 브랜치에 push했는지 확인
   - `service-*/**` 경로 변경이 있는지 확인

### ArgoCD가 자동 Sync하지 않음

1. **Automated Sync 확인**
   ```bash
   kubectl get application account-service-dev -n argocd -o yaml | grep -A 5 syncPolicy
   ```

2. **Git Repository 접근 확인**
   ```bash
   argocd repo list
   ```

3. **ArgoCD Application 상태 확인**
   ```bash
   argocd app get account-service-dev
   ```

### Helm Values 업데이트가 안 됨

1. **Terraform Output 확인**
   ```bash
   cd terraform/envs/dev
   terraform output
   ```

2. **update-helm-values.sh 스크립트 확인**
   ```bash
   cd terraform/scripts
   ./update-helm-values.sh dev
   ```

## 📝 참고사항

### [skip ci] 태그

GitHub Actions workflow에서 `[skip ci]` 태그를 사용하여 무한 루프를 방지합니다:

```yaml
git commit -m "chore: update Helm values from Terraform outputs [skip ci]"
```

이 태그가 있으면 GitHub Actions가 다시 실행되지 않습니다. 하지만 ArgoCD는 Git 변경사항을 직접 감지하므로 자동으로 Sync됩니다.

### ArgoCD Sync 주기

ArgoCD는 기본적으로 **3분마다** Git Repository를 확인합니다. 변경사항이 감지되면 자동으로 Sync합니다.

### 수동 배포

필요시 수동으로 배포할 수도 있습니다:

```bash
# GitHub Actions 수동 실행
# Repository → Actions → "Deploy to Dev Environment" → Run workflow

# ArgoCD 수동 Sync
argocd app sync account-service-dev
```

---

**결론**: GitHub Secrets만 설정하면 자동으로 CI/CD가 작동합니다! 🎉

