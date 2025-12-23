# ArgoCD Applications

이 디렉토리는 Passit 프로젝트의 모든 마이크로서비스를 관리하는 ArgoCD Application 매니페스트를 포함합니다.

## 구조

```
argocd/
├── app-of-apps.yaml              # App of Apps 패턴 - 모든 서비스를 관리하는 메인 Application
└── applications/
    ├── account-service-dev.yaml  # Account 서비스 Application
    ├── ticket-service-dev.yaml   # Ticket 서비스 Application
    ├── trade-service-dev.yaml    # Trade 서비스 Application
    ├── cs-service-dev.yaml       # CS 서비스 Application
    └── chat-service-dev.yaml     # Chat 서비스 Application
```

## App of Apps 패턴

App of Apps는 하나의 부모 Application이 여러 자식 Application을 관리하는 패턴입니다.

### 장점

- 모든 서비스를 한 번에 배포 가능
- 단일 지점에서 모든 서비스 관리
- 새로운 서비스 추가가 쉬움
- Git을 통한 선언적 관리

### 배포 방법

#### 1. App of Apps 배포

```bash
# 메인 Application 배포
kubectl apply -f app-of-apps.yaml

# 상태 확인
argocd app get passit-services
```

#### 2. 개별 서비스 Application 확인

```bash
# 모든 서비스 확인
argocd app list

# 특정 서비스 확인
argocd app get account-service-dev
argocd app get ticket-service-dev
argocd app get trade-service-dev
argocd app get cs-service-dev
argocd app get chat-service-dev
```

#### 3. 서비스 동기화

```bash
# 모든 서비스 동기화
argocd app sync passit-services

# 개별 서비스 동기화
argocd app sync account-service-dev
```

## 서비스 Application 스펙

각 서비스 Application은 다음을 포함합니다:

- **source**: Git 저장소와 각 서비스의 Helm chart 경로
- **destination**: EKS 클러스터와 namespace (services)
- **syncPolicy**: 자동 동기화 및 복구 설정
  - `automated.prune`: 더 이상 사용하지 않는 리소스 자동 삭제
  - `automated.selfHeal`: 수동으로 변경된 리소스 자동 복구
  - `syncOptions.CreateNamespace`: namespace 자동 생성

## 새로운 서비스 추가

1. 서비스의 Helm chart 생성
2. `applications/` 디렉토리에 서비스 Application 매니페스트 추가 (예: `chat-service-dev.yaml`)
3. Git에 커밋 및 푸시

ArgoCD가 자동으로 감지하고 새 서비스를 배포합니다.

**참고**: kustomization.yaml을 사용하지 않으므로, 각 Application 파일을 직접 관리합니다.

## Terraform Output 값 적용

배포 전 각 서비스의 overlay에서 다음 값들을 Terraform output으로 업데이트해야 합니다:

```bash
# Terraform output 확인
cd terraform/envs/dev
terraform output

# 각 서비스 overlay 업데이트 (예: service-account)
cd service-account/k8s/overlays/dev
# kustomization.yaml의 패치 값 업데이트:
# - RDS_ENDPOINT_FROM_TERRAFORM_OUTPUT
# - ELASTICACHE_ENDPOINT_FROM_TERRAFORM_OUTPUT
# - IRSA_ROLE_ARN_FROM_TERRAFORM_OUTPUT
```

## 트러블슈팅

### Application이 Sync되지 않는 경우

```bash
# Application 상태 확인
argocd app get <app-name>

# 수동 동기화 시도
argocd app sync <app-name> --force

# Diff 확인
argocd app diff <app-name>
```

### Health Check 실패

```bash
# Pod 로그 확인
kubectl logs -n services <pod-name>

# Pod 상태 확인
kubectl describe pod -n services <pod-name>

# ServiceAccount IRSA 설정 확인
kubectl describe sa -n services <service-account-name>
```

### IRSA 권한 문제

```bash
# ServiceAccount annotation 확인
kubectl get sa -n services <sa-name> -o yaml | grep eks.amazonaws.com/role-arn

# Pod에서 AWS 권한 테스트
kubectl exec -n services <pod-name> -- aws sts get-caller-identity
```

## 참고 자료

- [ArgoCD App of Apps Pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
- [Helm Documentation](https://helm.sh/docs/)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
