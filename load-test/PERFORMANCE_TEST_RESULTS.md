# Passit 부하/성능 테스트 결과

## 📋 테스트 개요

### 사용한 부하 테스트 도구

**k6** (Grafana k6)

- JavaScript 기반 스크립트 작성
- CLI 기반 실행으로 CI/CD 통합 용이
- 상세한 메트릭 수집 및 리포트 생성

### 대상이 된 주요 API 목록

#### ✅ 테스트 완료

1. **로그인** (`POST /api/auth/login`)

   - 인증 API의 핵심
   - JWT 토큰 발급 성능 확인

2. **티켓 목록 조회** (`GET /api/tickets`)

   - 가장 빈번한 조회 API
   - 페이지네이션 및 필터링 성능

3. **티켓 상세 조회** (`GET /api/tickets/{id}`)
   - 단일 리소스 조회 성능
   - DB 조회 최적화 확인
   - 티켓 목록 조회 스크립트에 포함됨

#### 📋 테스트 예정

4. **거래 요청** (`POST /api/deals/request`)

   - 트랜잭션 처리 성능
   - SNS/SQS 메시지 처리 성능
   - **상태**: 스크립트 준비 완료, 테스트 미실시

5. **공지사항 목록** (`GET /notices`)
   - 읽기 전용 API 성능
   - 캐싱 효과 확인
   - **상태**: 스크립트 준비 완료, 테스트 미실시

---

## 테스트 조건

### 테스트 시나리오 유형

#### 1. 단일 API 테스트

- 각 API를 독립적으로 테스트
- 기본 성능 및 병목 지점 파악

#### 2. 사용자 여정 시나리오

- 실제 사용자 플로우 시뮬레이션
- 로그인 → 티켓 목록 → 티켓 상세 → 공지사항 조회

### 테스트 파라미터

| 항목                     | Dev    | Prod    | DR     |
| ------------------------ | ------ | ------- | ------ |
| **동시 사용자 수 (VUs)** | 50     | 100     | 50     |
| **테스트 시간**          | 2분    | 3분     | 2분    |
| **Ramp-up 시간**         | 30초   | 1분     | 30초   |
| **Ramp-down 시간**       | 30초   | 30초    | 30초   |
| **총 요청 수 (예상)**    | ~5,000 | ~10,000 | ~5,000 |

---

## 핵심 지표 요약

### Dev 환경

| API            | P95 응답시간 (ms) | 평균 응답시간 (ms) | 에러율 (%) | RPS | 상태           |
| -------------- | ----------------- | ------------------ | ---------- | --- | -------------- |
| 로그인         | -                 | -                  | -          | -   | ✅ 테스트 완료 |
| 티켓 목록/상세 | -                 | -                  | -          | -   | ✅ 테스트 완료 |
| 거래 요청      | -                 | -                  | -          | -   | ⏳ 테스트 예정 |
| 공지사항       | -                 | -                  | -          | -   | ⏳ 테스트 예정 |

> **📝 참고**: 실제 테스트 결과는 아래 "실제 테스트 결과" 섹션을 참고하세요.

### Prod 환경

| API            | P95 응답시간 (ms) | 평균 응답시간 (ms) | 에러율 (%) | RPS | 상태           |
| -------------- | ----------------- | ------------------ | ---------- | --- | -------------- |
| 로그인         | -                 | -                  | -          | -   | ✅ 테스트 완료 |
| 티켓 목록/상세 | -                 | -                  | -          | -   | ✅ 테스트 완료 |
| 거래 요청      | -                 | -                  | -          | -   | ⏳ 테스트 예정 |
| 공지사항       | -                 | -                  | -          | -   | ⏳ 테스트 예정 |

> **📝 참고**: 실제 테스트 결과는 아래 "실제 테스트 결과" 섹션을 참고하세요.

### DR 환경

| API            | P95 응답시간 (ms) | 평균 응답시간 (ms) | 에러율 (%) | RPS | 상태           |
| -------------- | ----------------- | ------------------ | ---------- | --- | -------------- |
| 로그인         | -                 | -                  | -          | -   | ⏳ 테스트 예정 |
| 티켓 목록/상세 | -                 | -                  | -          | -   | ⏳ 테스트 예정 |
| 거래 요청      | -                 | -                  | -          | -   | ⏳ 테스트 예정 |
| 공지사항       | -                 | -                  | -          | -   | ⏳ 테스트 예정 |

---

## 실제 테스트 결과

### Dev 환경

**테스트 일시**: 2026-01-06

#### 로그인 API (`POST /api/auth/login`)

- **결과 파일**: `results/dev/auth-20260106-165208.json`
- **P95 응답시간**: `node scripts/analyze-results.js results/dev/auth-20260106-165208.json` 실행하여 확인
- **평균 응답시간**: 분석 필요
- **에러율**: 분석 필요
- **RPS**: 분석 필요

#### 티켓 API (`GET /api/tickets`, `GET /api/tickets/{id}`)

- **결과 파일**: `results/dev/tickets-20260106-165818.json`
- **P95 응답시간**: 분석 필요
- **평균 응답시간**: 분석 필요
- **에러율**: 분석 필요
- **RPS**: 분석 필요

### Prod 환경

**테스트 일시**: 2026-01-06

#### 로그인 API (`POST /api/auth/login`)

- **결과 파일**: `results/prod/auth-20260106-165556.json`
- **P95 응답시간**: 분석 필요
- **평균 응답시간**: 분석 필요
- **에러율**: 분석 필요
- **RPS**: 분석 필요

#### 티켓 API (`GET /api/tickets`, `GET /api/tickets/{id}`)

- **결과 파일**: `results/prod/tickets-20260106-170222.json`
- **P95 응답시간**: 분석 필요
- **평균 응답시간**: 분석 필요
- **에러율**: 분석 필요
- **RPS**: 분석 필요

> **💡 결과 분석 방법**:
>
> ```bash
> # Dev 환경 로그인 결과 분석
> node scripts/analyze-results.js results/dev/auth-20260106-165208.json
>
> # Dev 환경 티켓 결과 분석
> node scripts/analyze-results.js results/dev/tickets-20260106-165818.json
>
> # Prod 환경 로그인 결과 분석
> node scripts/analyze-results.js results/prod/auth-20260106-165556.json
>
> # Prod 환경 티켓 결과 분석
> node scripts/analyze-results.js results/prod/tickets-20260106-170222.json
> ```

### 테스트 실행 명령어

```bash
# Dev 환경 - 로그인 API
./run-load-test.sh dev auth.js

# Dev 환경 - 티켓 API
./run-load-test.sh dev tickets.js

# Dev 환경 - 사용자 여정
./run-load-test.sh dev user-journey.js

# Prod 환경 - 로그인 API
./run-load-test.sh prod auth.js
```

### 결과 분석

```bash
# 결과 파일 분석
node scripts/analyze-results.js results/dev/auth-20250106-120000.json
```

---

## 결과 해석

> **⚠️ 주의**: 현재는 로그인과 티켓 API만 테스트되었습니다. 아래 해석은 예상되는 내용이며, 실제 테스트 결과를 분석한 후 업데이트가 필요합니다.

### 1. 현재 테스트 완료된 API 분석

**로그인 API** (`POST /api/auth/login`):

- 인증 처리 성능 확인
- JWT 토큰 발급 오버헤드 측정
- 실제 결과 분석 필요

**티켓 API** (`GET /api/tickets`, `GET /api/tickets/{id}`):

- 조회 성능 확인
- 페이지네이션 처리 성능
- DB 쿼리 최적화 확인
- 실제 결과 분석 필요

### 2. 환경별 성능 차이 (예상)

**Prod > Dev** 순서로 성능이 좋을 것으로 예상됩니다:

- **Prod가 더 빠른 이유**:
  - 더 많은 리소스 할당 (CPU, Memory)
  - 최적화된 인프라 구성
- **Dev가 상대적으로 느린 이유**:
  - 개발 환경으로 리소스가 제한적
  - 디버깅 로그로 인한 오버헤드

### 3. 향후 테스트 예정 API

**거래 요청 API** (`POST /api/deals/request`):

- 트랜잭션 처리 성능 측정 예정
- SNS/SQS 메시지 처리 성능 확인 예정

**공지사항 API** (`GET /notices`):

- 읽기 전용 API 성능 측정 예정
- 캐싱 효과 확인 예정

### 4. 확장성 고려사항

실제 테스트 결과를 바탕으로:

- 현재 처리 가능한 트래픽 수준 파악
- 병목 지점 식별
- Auto Scaling 및 로드 밸런싱 최적화 필요 여부 판단

---

## 향후 테스트 계획

### 추가 테스트 예정 API

1. **거래 요청** (`POST /api/deals/request`)

   ```bash
   ./run-load-test.sh dev deals.js
   ./run-load-test.sh prod deals.js
   ```

2. **공지사항 목록** (`GET /notices`)

   ```bash
   ./run-load-test.sh dev notices.js
   ./run-load-test.sh prod notices.js
   ```

3. **사용자 여정 시나리오** (통합 테스트)
   ```bash
   ./run-load-test.sh dev user-journey.js
   ./run-load-test.sh prod user-journey.js
   ```

## 개선 권장사항

> **⚠️ 주의**: 아래 권장사항은 일반적인 성능 최적화 방안입니다. 실제 테스트 결과를 분석한 후 구체적인 개선 방안을 수립하세요.

1. **테스트 결과 분석 후 개선점 도출**

   - 실제 테스트 결과를 분석하여 병목 지점 파악
   - 환경별 성능 차이 원인 분석

2. **읽기 API 캐싱 강화** (티켓 조회 등)

   - Redis/Valkey를 활용한 응답 캐싱
   - CDN 활용 (정적 리소스)

3. **인프라 확장**

   - Auto Scaling 설정
   - DB Connection Pool 최적화
   - 로드 밸런서 설정 조정

4. **모니터링 강화**
   - APM 도구 도입 (예: New Relic, Datadog)
   - 실시간 메트릭 대시보드 구성

---

## 테스트 실행 방법

```bash
# Dev 환경 테스트
./run-load-test.sh dev auth.js
./run-load-test.sh dev tickets.js
./run-load-test.sh dev user-journey.js

# Prod 환경 테스트
./run-load-test.sh prod auth.js
./run-load-test.sh prod tickets.js
./run-load-test.sh prod user-journey.js
```

---

## 결과 파일 위치

- `results/dev/` - Dev 환경 테스트 결과
- `results/prod/` - Prod 환경 테스트 결과
- `results/dr/` - DR 환경 테스트 결과

---

**마지막 업데이트**: 2025-01-06  
**테스트 도구 버전**: k6 v0.48.0
