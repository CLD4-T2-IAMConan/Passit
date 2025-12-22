# Terraform 리소스 테스트 스크립트

이 디렉토리에는 배포된 AWS 리소스(Valkey, S3)를 테스트하는 스크립트가 포함되어 있습니다.

## 사전 요구사항

### 공통

- AWS CLI 설치 및 구성 (`aws configure`)
- 적절한 IAM 권한 (Secrets Manager 읽기, S3 접근 등)

### Valkey 테스트

- **Bash 스크립트**: `redis-cli` 설치 (선택사항)

  ```bash
  # macOS
  brew install redis

  # Ubuntu/Debian
  sudo apt-get install redis-tools
  ```

- **Python 스크립트**: Python 3.6+ 및 필수 패키지
  ```bash
  pip install boto3 redis
  ```

### S3 테스트

- **Python 스크립트**: Python 3.6+ 및 boto3
  ```bash
  pip install boto3
  ```

## 사용 방법

### Valkey (ElastiCache) 테스트

#### Bash 스크립트

```bash
# Dev 환경 테스트
./test-valkey.sh dev

# Prod 환경 테스트
./test-valkey.sh prod
```

#### Python 스크립트

```bash
# Dev 환경 테스트
python3 test-valkey-python.py dev

# Prod 환경 테스트
python3 test-valkey-python.py prod
```

**테스트 내용:**

- Secrets Manager에서 연결 정보 조회
- Valkey 연결 확인 (PING)
- 기본 정보 조회 (버전, 업타임 등)
- 데이터 쓰기/읽기 테스트
- 리스트 및 해시 데이터 타입 테스트

**주의사항:**

- Valkey는 VPC 내부에서만 접근 가능합니다
- 로컬에서 테스트하려면 VPN 또는 Bastion 호스트를 통해 접근해야 합니다
- EKS Pod에서 테스트하는 것이 가장 안전합니다

**EKS Pod에서 테스트:**

```bash
# 연결 정보 확인
ENDPOINT=$(aws secretsmanager get-secret-value \
  --secret-id passit/prod/valkey/connection \
  --query 'SecretString' --output text | jq -r '.primary_endpoint')
PORT=$(aws secretsmanager get-secret-value \
  --secret-id passit/prod/valkey/connection \
  --query 'SecretString' --output text | jq -r '.port')

# Pod에서 테스트
kubectl run -it --rm redis-test \
  --image=redis:7-alpine \
  --restart=Never \
  -- redis-cli -h $ENDPOINT -p $PORT PING
```

### S3 버킷 테스트

#### Bash 스크립트

```bash
# Dev 환경 테스트
./test-s3.sh dev

# Prod 환경 테스트
./test-s3.sh prod
```

#### Python 스크립트

```bash
# Dev 환경 테스트
python3 test-s3-python.py dev

# Prod 환경 테스트
python3 test-s3-python.py prod
```

**테스트 내용:**

- 버킷 존재 확인
- 버킷 정보 조회 (Location, Versioning, Encryption)
- 파일 업로드 테스트
- 파일 다운로드 테스트
- 테스트 파일 삭제

**테스트되는 버킷:**

- `passit-{env}-uploads`
- `passit-{env}-logs`
- `passit-{env}-backup`

## 문제 해결

### Valkey 연결 실패

**증상:** `Connection refused` 또는 타임아웃

**가능한 원인:**

1. Security Group이 접근을 허용하지 않음
   - EKS 노드의 Security Group이 ElastiCache Security Group에 허용되어 있는지 확인
2. 네트워크 경로 문제
   - Valkey는 Private Subnet에 배포되어 VPC 내부에서만 접근 가능
   - VPN 또는 Bastion 호스트를 통해 접근 필요
3. ElastiCache 클러스터가 아직 생성 중
   - AWS 콘솔에서 클러스터 상태 확인

**해결 방법:**

```bash
# Security Group 확인
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=passit-prod-elasticache-sg" \
  --query 'SecurityGroups[0].IpPermissions'

# ElastiCache 상태 확인
aws elasticache describe-replication-groups \
  --replication-group-id passit-prod-valkey \
  --query 'ReplicationGroups[0].Status'
```

### S3 업로드 실패

**증상:** `Access Denied` 또는 권한 오류

**가능한 원인:**

1. IAM 권한 부족
   - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` 권한 필요
2. 버킷 정책 제한
   - 버킷 정책에서 특정 조건만 허용하는 경우
3. KMS 키 권한 부족 (암호화 사용 시)
   - KMS 키에 대한 `kms:Decrypt`, `kms:GenerateDataKey` 권한 필요

**해결 방법:**

```bash
# 현재 IAM 사용자 확인
aws sts get-caller-identity

# 버킷 정책 확인
aws s3api get-bucket-policy --bucket passit-prod-uploads

# IAM 정책 확인
aws iam list-user-policies --user-name <your-username>
```

## 추가 리소스

- [AWS ElastiCache 문서](https://docs.aws.amazon.com/elasticache/)
- [AWS S3 문서](https://docs.aws.amazon.com/s3/)
- [Redis 명령어 참조](https://redis.io/commands)
- [AWS CLI S3 명령어](https://docs.aws.amazon.com/cli/latest/reference/s3/)
