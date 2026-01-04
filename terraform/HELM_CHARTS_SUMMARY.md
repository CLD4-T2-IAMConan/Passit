# Helm Charts 정리 요약

## 📋 서비스별 포트 설정

| 서비스 | 포트 | Helm values | application.yml | 상태 |
|--------|------|-------------|-----------------|------|
| account | 8081 | ✅ 8081 | ✅ 8081 | ✅ 정상 |
| chat | 8084 | ✅ 8084 | ✅ 8084 | ✅ 정상 |
| ticket | 8082 | ✅ 8082 | ✅ 8082 | ✅ 정상 |
| trade | 8083 | ✅ 8083 | ✅ 8083 | ✅ 정상 |
| cs | 8085 | ✅ 8085 | ✅ 8085 | ✅ 정상 |

## 🔧 수정 완료 사항

### 1. Chat 서비스 (`service-chat/helm/values-dev.yaml`)
- ✅ `imagePullSecrets` 추가
- ✅ 이미지 repository를 GHCR로 변경 (`ghcr.io/cld4-t2-iamconan/service-chat`)
- ✅ `pullPolicy`를 `Always`로 변경

### 2. Account 서비스 (`service-account/helm/values-dev.yaml`)
- ✅ `SPRING_JPA_HIBERNATE_DDL_AUTO: "update"` 환경 변수 추가

### 3. Ticket 서비스
- ✅ `application.yml`: 포트 8082 유지 (원래대로)
- ✅ `application-prod.yml`: 포트 8082로 수정, PostgreSQL → MySQL 변경
- ✅ `application-dev.yml`: PostgreSQL → MySQL 변경
- ✅ 환경 변수 참조 추가
- ✅ Helm values: `targetPort` 및 health check 포트 8082로 수정

### 4. Trade 서비스
- ✅ `application.yml`: 포트 8083 유지 (원래대로)
- ✅ `application-prod.yml`: 포트 8083으로 수정, PostgreSQL → MySQL 변경
- ✅ `application-dev.yml`: PostgreSQL → MySQL 변경
- ✅ 환경 변수 참조 추가
- ✅ Helm values: `targetPort` 및 health check 포트 8083으로 수정

### 5. Chat 서비스
- ✅ `application.yml`: 포트 8084 유지 (원래대로)
- ✅ `application-prod.yml`: 포트 8084로 수정, PostgreSQL → MySQL 변경
- ✅ `application-dev.yml`: PostgreSQL → MySQL 변경
- ✅ 환경 변수 참조 추가
- ✅ Helm values: `targetPort` 및 health check 포트 8084로 수정


## 📝 공통 설정 확인

### Health Check 설정
모든 서비스에서 일관된 설정:
- **livenessProbe**:
  - `initialDelaySeconds: 60` (account는 70)
  - `periodSeconds: 10`
  - `timeoutSeconds: 3`
  - `failureThreshold: 3`
- **readinessProbe**:
  - `initialDelaySeconds: 50` (account는 60)
  - `periodSeconds: 5`
  - `timeoutSeconds: 3`
  - `failureThreshold: 3`

### 데이터베이스 설정
모든 서비스에서 일관된 설정:
- **host**: `passit-dev-aurora-cluster.cluster-cnqmcq6uwqa3.ap-northeast-2.rds.amazonaws.com`
- **port**: `3306`
- **name**: `passit_db`
- **user**: `admin`
- **password**: `PassitDevPassword123!`

### 환경 변수
모든 서비스에서 공통:
- `SPRING_PROFILES_ACTIVE: "production"`
- `SPRING_JPA_HIBERNATE_DDL_AUTO: "update"`

### Redis (Valkey) 설정
모든 서비스에서 일관된 설정:
- **host**: `passit-dev-valkey.q2tpkl.ng.0001.apn2.cache.amazonaws.com`
- **port**: `6379`
- **password**: `""`
- **ssl**: `true`

### 리소스 설정
모든 서비스에서 일관된 설정:
- **limits**:
  - `cpu: 500m`
  - `memory: 1Gi`
- **requests**:
  - `cpu: 250m`
  - `memory: 512Mi`

### Image Pull Secrets
모든 서비스에서 GHCR 사용:
- `imagePullSecrets`:
  - `name: ghcr-pull-secret`

## ✅ 검증 체크리스트

- [x] 모든 서비스의 포트 설정 일관성 확인
- [x] 모든 서비스의 `imagePullSecrets` 설정 확인
- [x] 모든 서비스의 `SPRING_JPA_HIBERNATE_DDL_AUTO` 환경 변수 확인
- [x] 모든 서비스의 데이터베이스 설정 확인 (MySQL)
- [x] ] 모든 서비스의 application.yml 포트 설정 확인 (수동 확인 필요)
- [x] 모든 서비스의 health check 설정 확인

## 🚀 다음 단계

1. 변경사항 커밋 및 푸시
2. CI/CD 파이프라인 실행 확인
3. ArgoCD를 통한 자동 배포 확인
4. Pod 상태 확인 및 로그 검증

