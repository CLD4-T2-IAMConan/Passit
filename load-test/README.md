# Passit 부하/성능 테스트

## 📋 목차

1. [개요](#개요)
2. [테스트 도구](#테스트-도구)
3. [테스트 대상 API](#테스트-대상-api)
4. [테스트 실행](#테스트-실행)
5. [결과 분석](#결과-분석)
6. [테스트 시나리오](#테스트-시나리오)

---

## 개요

Passit 프로젝트의 부하/성능 테스트를 위한 구조입니다.

### 디렉토리 구조

```
load-test/
├── scripts/                    # k6 테스트 스크립트
│   ├── auth.js                # 인증 API 테스트
│   ├── tickets.js             # 티켓 API 테스트
│   ├── deals.js               # 거래 API 테스트
│   ├── notices.js             # 공지사항 API 테스트
│   └── user-journey.js        # 사용자 여정 시나리오
├── results/                    # 테스트 결과 (CSV, JSON)
│   ├── dev/
│   ├── prod/
│   └── dr/
├── config/                     # 환경별 설정
│   ├── dev.json
│   ├── prod.json
│   └── dr.json
├── reports/                    # HTML 리포트
└── README.md                   # 이 파일
```

---

## 테스트 도구

### k6 (추천)

**장점:**

- JavaScript 기반으로 작성 간편
- CLI 기반으로 CI/CD 통합 용이
- 상세한 메트릭 제공
- 무료 오픈소스

**설치:**

```bash
# macOS
brew install k6

# 또는 Docker 사용
docker pull grafana/k6
```

### 대안 도구

- **JMeter**: GUI 기반, 복잡한 시나리오에 적합
- **Apache Bench (ab)**: 간단한 단일 API 테스트
- **Postman Collection + Newman**: 기존 Postman Collection 활용

---

## 테스트 대상 API

### 주요 API 목록 (5개)

1. **로그인** (`POST /api/auth/login`)

   - 인증이 필요한 모든 API의 전제 조건
   - JWT 토큰 발급 성능 확인

2. **티켓 목록 조회** (`GET /api/tickets`)

   - 가장 빈번한 조회 API
   - 페이지네이션 성능 확인

3. **티켓 상세 조회** (`GET /api/tickets/{id}`)

   - 단일 리소스 조회 성능
   - DB 조회 최적화 확인

4. **거래 요청** (`POST /api/deals/request`)

   - 트랜잭션 처리 성능
   - SNS/SQS 메시지 처리 성능

5. **공지사항 목록** (`GET /notices`)
   - 읽기 전용 API 성능
   - 캐싱 효과 확인

---

## 테스트 실행

### 기본 실행

```bash
# 단일 API 테스트
k6 run scripts/auth.js

# 환경별 실행
k6 run --env BASE_URL=http://passit-dev-alb-1898503115.ap-northeast-2.elb.amazonaws.com scripts/tickets.js

# 결과 저장
k6 run --out json=results/dev/tickets-$(date +%Y%m%d-%H%M%S).json scripts/tickets.js
```

### 환경별 실행 스크립트

```bash
# Dev 환경
./run-load-test.sh dev

# Prod 환경
./run-load-test.sh prod
```

---

## 테스트 시나리오

### 1. 단일 API 테스트

각 API를 독립적으로 테스트하여 기본 성능 확인

### 2. 사용자 여정 시나리오

실제 사용자 플로우를 시뮬레이션:

1. 로그인
2. 티켓 목록 조회
3. 티켓 상세 조회
4. 거래 요청

---

## 결과 분석

### 핵심 지표

- **P95 응답 시간**: 95%의 요청이 이 시간 내에 완료
- **평균 응답 시간**: 전체 요청의 평균 응답 시간
- **에러율**: 실패한 요청의 비율
- **RPS (Requests Per Second)**: 초당 처리 요청 수
- **동시 사용자 수**: 동시에 처리 가능한 사용자 수

### 결과 비교

Dev/Prod/DR 환경별 성능 비교를 통해:

- 인프라 차이 확인
- 최적화 필요 영역 파악
- 병목 지점 식별

---

## 참고 자료

- [k6 공식 문서](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [성능 테스트 베스트 프랙티스](https://k6.io/docs/test-types/load-testing/)
