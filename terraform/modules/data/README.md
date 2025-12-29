# Data Module

Passit 프로젝트의 데이터 저장소와 오브젝트 스토리지를 관리하는 Terraform 모듈입니다.

## 📋 목차

- [개요](#개요)
- [파일 구조](#파일-구조)
- [주요 리소스](#주요-리소스)
- [보안 및 네트워크](#보안-및-네트워크)
- [Outputs](#Outputs)

---


## 개요
data 모듈은 서비스 운영에 필요한 고가용성 데이터 저장소와 오브젝트 스토리지를 프로비저닝합니다:
- Amazon Aurora MySQL: 고가용성 및 성능 최적화된 관계형 데이터베이스 클러스터
- ElastiCache (Valkey): 세션 및 캐싱을 위한 인메모리 데이터 저장소
- Amazon S3: 파일 업로드, 로그 저장 및 백업용 오브젝트 스토리지
- 유연한 구성: 기존 리소스(Subnet Group, Parameter Group) 재사용 기능 지원


## 파일 구조
```Plain Text
terraform\modules\data\
├── README.md         # 이 문서
├── variables.tf      # 입력 변수 정의
├── outputs.tf        # 엔드포인트 및 ARN 출력 정의
├── rds.tf            # Aurora MySQL 클러스터 및 인스턴스
├── Valkey.tf         # Valkey 복제 그룹 및 연결 시크릿
├── s3.tf             # 용도별 S3 버킷 및 정책
└── backup.tf         # RDS 및 메모리 데이터베이스 백업 구성
```

##  주요 리소스
### RDS (Amazon Aurora MySQL)
- 엔진: `aurora-mysql` (MySQL 8.0 호환)
- 가용성 구성:
  - Prod: 2개 노드 (Writer 1, Reader 1)/7일 ㅐㅂㄱ업 보존/삭제 방지 활성화
  - Dev: 1개 노드 (Writer 1)/1일 백업 보존/삭제 방지 비활성화
- 자격 증명 관리: `db_secret_name` 변수가 제공되면 Secrets Manager에서 정보를 가져온다
- 파라미터 그룹: 한국 시간대 및(`Asia/Seoul`) 및 이모지 대응(`utf8mb4`) 설정을 기본 포함한다.

### ElastiCache (Valkey)
- 엔진: `Valkey 8.0`
- 보안: 저장 데이터 암호화 및 연결 정보 자동 시크릿 생성 기능 포함
- 연결 시크릿: `${project}/${env}/valkey/connection`
경로에 엔드포인트와 포트 정보가 자동 저장됨

### Amazon S3
- 생성 버킷: 용도별 3종(`uploads`, `logs`, `backup`) 생성
- 보안 정책:
  - SSL을 통한 접근만 허용 (`DenyInsecureTransport`)
  - 모든 퍼블릭 접근 차단 (`Public Access Block`)
  - KMS을 이용한 서버 측 암호화(SSE) 적용
- 생명 주기: `logs` 버킷의 경우 30일 후 IA(Infrequent Access), 90일 후 Glacier로 자동 전환하여 비용 절감


## 보안 및 네트워크
### 네트워크 격리
모든 데이터 리소스(RDS, Valkey)는 Private DB Subnet에 배치되며, `publicly_accessible = false` 설정을 통해 공인 인터넷 접근을 차단한다.

### 보안 그룹(Security Group) 규칙
| 대상 리소스 | 허용 포트             | 허용 소스         | 비고          |
|--------|-------------------|---------------|-------------|
| RDS    | TCP 3306 (MySQL)  | EKS Worker SG | Pod에서 DB 접근 |
| Valkey | TCP 6379 (Valkey) | EKS Worker SG | Pod에서 캐시 접근 |


## Outputs
Data 모듈에서 출력되는 주요 값

### RDS (Aurora MySQL)
- `rds_cluster_endpoint`: 클러스터 쓰기 엔드포인트
- `rds_reader_endpoint`: 클러스터 읽기 전용 엔드포인트

### ElastiCache (Valkey)
- `valkey_primary_endpoint`: 기본 접속 주소
- `valkey_port`: 포트 번호 (6379)
- `valkey_secret_arn`: 연결 정보가 담긴 Secrets Manager ARN

### S3 (Object Storage)
- `s3_bucket_ids`: 생성된 전체 버킷 ID 맵
- `s3_bucket_arns`: 생성된 전체 버킷 ARN 맵
- `s3_uploads_bucket_id`: 업로드 버킷 ID (uploads)
- `s3_logs_bucket_id`: 로그 버킷 ID (logs)
- `s3_backup_bucket_id`: 백업 버킷 ID (backup)