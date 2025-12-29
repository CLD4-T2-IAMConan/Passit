# ArgoCD Applications

ArgoCD를 사용하여 서비스를 배포하기 위한 Application manifest입니다.

## 서비스 목록

- `account-service-dev.yaml` - Account 서비스
- `ticket-service-dev.yaml` - Ticket 서비스
- `trade-service-dev.yaml` - Trade 서비스
- `cs-service-dev.yaml` - CS 서비스
- `chat-service-dev.yaml` - Chat 서비스

**참고**: kustomization.yaml을 사용하지 않으며, 각 Application 파일을 직접 관리합니다.

## 사전 준비

### 1. ArgoCD 설치 확인

```bash
# EKS 클러스터 접근 설정
aws eks update-kubeconfig \
  --name passit-dev-eks \
  --region ap-northeast-2

# ArgoCD 설치 확인
kubectl get pods -n argocd
```

### 2. ArgoCD UI 접근

```bash
# ArgoCD admin 비밀번호 확인
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward로 UI 접근
kubectl port-forward svc/argocd-server -n argocd 8080:443

# 브라우저에서 https://localhost:8080 접속
# Username: admin
# Password: (위에서 확인한 비밀번호)
```

### 3. ArgoCD CLI 설치 (선택적)

```bash
# macOS
brew install argocd

# Linux
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd /usr/local/bin/argocd
rm argocd

# ArgoCD 로그인
argocd login localhost:8080
```

## Application 배포

### 방법 1: kubectl로 직접 적용

```bash
# Application manifest 수정 (repoURL, targetRevision 등)
vim applications/account-service-dev.yaml

# 적용
kubectl apply -f applications/account-service-dev.yaml

# 상태 확인
kubectl get application -n argocd
```

### 방법 2: ArgoCD CLI 사용

```bash
argocd app create account-service-dev \
  --repo https://github.com/YOUR_ORG/Passit.git \
  --path service-account/helm \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace services \
  --sync-policy automated \
  --self-heal \
  --auto-prune \
  --helm-set-file values=values-dev.yaml
```

### 방법 3: ArgoCD UI 사용

1. https://localhost:8080 접속
2. "+ NEW APP" 클릭
3. 정보 입력:
   - Application Name: `account-service-dev`
   - Project: `default`
   - Sync Policy: `Automatic`
   - Repository URL: `https://github.com/YOUR_ORG/Passit.git`
   - Revision: `main`
   - Path: `service-account/helm`
   - Helm Values File: `values-dev.yaml`
   - Cluster URL: `https://kubernetes.default.svc`
   - Namespace: `services`
4. "CREATE" 클릭

## Application 관리

### 동기화

```bash
# 수동 동기화
argocd app sync account-service-dev

# 동기화 상태 확인
argocd app get account-service-dev
```

### 롤백

```bash
# 이전 리비전으로 롤백
argocd app rollback account-service-dev

# 특정 리비전으로 롤백
argocd app history account-service-dev
argocd app rollback account-service-dev <REVISION>
```

### 삭제

```bash
# Application 삭제 (리소스 유지)
argocd app delete account-service-dev --cascade=false

# Application과 리소스 모두 삭제
argocd app delete account-service-dev
```

## 전체 서비스 배포

모든 마이크로서비스를 한 번에 배포:

```bash
# App of Apps 패턴 사용 (권장)
kubectl apply -f ../app-of-apps.yaml

# 또는 개별 Application 직접 적용
kubectl apply -f applications/
```

**참고**: App of Apps는 `terraform/argocd/applications` 경로의 모든 Application 파일을 자동으로 감지합니다. kustomization.yaml이 없어도 각 YAML 파일을 직접 읽습니다.

## 모니터링

```bash
# Application 상태 확인
argocd app list

# 특정 Application의 상세 정보
argocd app get account-service-dev

# 로그 확인
kubectl logs -n services -l app=account-service -f

# UI에서 확인
# https://localhost:8080 에서 시각적으로 확인 가능
```

## 문제 해결

### Sync 실패

```bash
# Sync 상태 확인
argocd app get account-service-dev

# 상세 로그 확인
argocd app logs account-service-dev

# 수동으로 리소스 확인
kubectl get all -n services -l app=account-service
```

### Health 체크 실패

```bash
# Pod 상태 확인
kubectl describe pod -n services -l app=account-service

# 로그 확인
kubectl logs -n services -l app=account-service --tail=100
```

## 서비스 목록

현재 관리되는 서비스:

- ✅ account-service-dev
- ✅ ticket-service-dev
- ✅ trade-service-dev
- ✅ cs-service-dev
- ✅ chat-service-dev

## 다음 단계

1. ✅ 모든 서비스 Application 생성 완료
2. ✅ App of Apps 패턴으로 전체 서비스 관리
3. [ ] Notification 설정 (Slack, Email 등)
4. [ ] RBAC 설정
5. [ ] 멀티 클러스터 관리
