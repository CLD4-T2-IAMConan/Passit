# Passit Common Infrastructure

이 디렉토리는 모든 Passit 마이크로서비스가 공유하는 MySQL 데이터베이스 인프라를 제공합니다.

## 구조

```
common/
├── docker-compose.yml          # 공통 MySQL 컨테이너 설정
├── init/
│   └── 01-init-databases.sql  # 공통 데이터베이스 자동 생성
├── .env.example               # 환경 변수 예시
└── README.md
```

## 시작하기

### 1. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값 수정
```

### 2. MySQL 컨테이너 시작

```bash
cd common
docker-compose up -d
```

### 3. 상태 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f mysql

# MySQL 연결 테스트
docker exec -it passit-mysql mysql -u passit_user -p
```

## 데이터베이스 구조

MySQL 컨테이너가 시작되면 **단일 공통 데이터베이스** `passit_db`가 자동으로 생성됩니다.

### 테이블 네이밍 규칙

모든 서비스는 같은 데이터베이스(`passit_db`)를 사용하되, 각 서비스별로 **테이블 prefix**를 사용하여 구분합니다:

| 서비스  | Prefix     | 테이블 예시                                |
| ------- | ---------- | ------------------------------------------ |
| Account | `account_` | `account_users`, `account_activities`      |
| Chat    | `chat_`    | `chat_messages`, `chat_rooms`              |
| CS      | `cs_`      | `cs_notices`, `cs_inquiries`, `cs_reports` |
| Ticket  | `ticket_`  | `ticket_events`, `ticket_purchases`        |
| Trade   | `trade_`   | `trade_deals`, `trade_payments`            |

## 각 서비스에서 연결 방법

각 서비스의 docker-compose.yml에서 다음과 같이 설정:

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: service-account
    environment:
      DB_HOST: passit-mysql
      DB_PORT: 3306
      DB_NAME: passit_db # 모든 서비스 동일
      DB_USER: passit_user
      DB_PASSWORD: passit_password
      TABLE_PREFIX: account_ # 서비스별로 다름
    ports:
      - "8080:8080"
    networks:
      - passit-network

networks:
  passit-network:
    external: true
    name: passit-network
```

**중요**:

- 모든 서비스는 `passit-network` 네트워크를 사용하여 MySQL 컨테이너에 접근합니다.
- `DB_NAME`은 모든 서비스가 `passit_db`로 동일합니다.
- `TABLE_PREFIX`는 각 서비스별로 다르게 설정합니다 (account*, chat*, cs*, ticket*, trade\_).

## 로컬 개발 환경 연결

로컬 애플리케이션(IDE에서 직접 실행)에서 연결 시:

```
DB_HOST: localhost
DB_PORT: 3306
DB_NAME: passit_db           # 모든 서비스 동일
DB_USER: passit_user
DB_PASSWORD: passit_password
TABLE_PREFIX: account_       # 서비스별로 다름
```

## 관리 명령어

```bash
# 중지
docker-compose down

# 중지 및 데이터 삭제
docker-compose down -v

# 재시작
docker-compose restart

# MySQL 백업
docker exec passit-mysql mysqldump -u root -prootpassword passit_db > backup.sql

# MySQL 복원
docker exec -i passit-mysql mysql -u root -prootpassword passit_db < backup.sql
```

## 네트워크 정보

- **네트워크 이름**: `passit-network`
- **드라이버**: bridge
- **컨테이너 이름**: `passit-mysql`
- **포트**: 3306 (호스트:컨테이너)

## 트러블슈팅

### 서비스에서 MySQL에 연결할 수 없는 경우

1. MySQL 컨테이너가 실행 중인지 확인:

   ```bash
   docker ps | grep passit-mysql
   ```

2. 네트워크가 생성되었는지 확인:

   ```bash
   docker network ls | grep passit-network
   ```

3. 서비스가 같은 네트워크를 사용하는지 확인:
   ```bash
   docker inspect <service-container> | grep passit-network
   ```

### 데이터베이스가 생성되지 않은 경우

```bash
# MySQL 컨테이너 접속
docker exec -it passit-mysql mysql -u root -p

# 데이터베이스 목록 확인
SHOW DATABASES;

# 수동 생성
CREATE DATABASE passit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 테이블 확인
USE passit_db;
SHOW TABLES;
```

## 보안 권장사항

프로덕션 환경에서는:

- 강력한 비밀번호 사용
- .env 파일을 .gitignore에 추가
- 필요한 경우 SSL/TLS 연결 설정
- 포트를 외부에 노출하지 않도록 설정
