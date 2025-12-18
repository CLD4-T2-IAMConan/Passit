# Security Module

보안 관련 리소스를 관리하는 모듈입니다. IAM, IRSA, KMS, Secrets Manager, Security Groups를 포함합니다.

## 구성 요소

### IAM Roles

- **EKS Cluster Role**: EKS 클러스터용 서비스 역할
- **EKS Node Group Role**: EKS Worker Node용 역할
- **GitHub Actions Role**: CI/CD 파이프라인용 역할
- **ArgoCD Role**: ArgoCD 배포용 역할
- **Prometheus Role**: 모니터링 수집용 역할
- **Fluent Bit Role**: 로그 수집용 역할
- **App Pod Role**: 애플리케이션 Pod용 역할 (Secrets Manager, RDS 접근)

### IRSA (IAM Roles for Service Accounts)

- EKS 클러스터의 OIDC Provider 설정
- Service Account와 IAM Role 연결

### KMS Keys

- **Secrets Manager용**: Secrets Manager 암호화
- **RDS용**: RDS 데이터 암호화
- **ElastiCache용**: ElastiCache 데이터 암호화
- **EBS용**: EKS Node Group EBS 볼륨 암호화

### Secrets Manager

- **RDS 자격 증명**: 데이터베이스 접근 정보
- **애플리케이션 시크릿**: JWT, API 키 등
- **ElastiCache 자격 증명**: 캐시 접근 정보

### Security Groups

- **ALB**: Application Load Balancer용
- **EKS Worker**: EKS Worker Node용
- **RDS**: RDS 데이터베이스용
- **ElastiCache**: ElastiCache용

## 사용 방법

```hcl
module "security" {
  source = "../../modules/security"

  account_id   = "727646470302"
  environment  = "dev"
  region       = "ap-northeast-2"
  project_name = "passit"
  vpc_id       = module.network.vpc_id
  eks_cluster_name = module.eks.cluster_name
}
```

## 의존성

- **Network Module**: VPC ID 필요
- **EKS Module**: EKS 클러스터 이름 필요 (IRSA 사용 시)

## 출력값

모든 IAM Role ARN, KMS Key ID/ARN, Secrets ARN, Security Group ID가 출력됩니다.
