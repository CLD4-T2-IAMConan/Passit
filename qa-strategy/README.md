# Passit QA Strategy

## 개요

Passit 프로젝트의 체계적인 품질 보장을 위한 QA 전략 및 테스트 가이드입니다.

**백엔드 (Spring Boot) + 프론트엔드 (React) 통합 QA 전략**

## 핵심 목표

1. **Test Pyramid 기반 3단계 테스트 구조**
2. **CI/CD 파이프라인 자동화**
3. **60% 이상의 테스트 커버리지**
4. **핵심 플로우 E2E 테스트**

## 디렉토리 구조

```
qa-strategy/
├── scripts/                        # 스크립트
│   ├── run-backend-tests.sh         # 백엔드 테스트 실행
│   ├── run-frontend-tests.sh        # 프론트엔드 테스트 실행
│   └── run-all-tests.sh             # 전체 테스트 실행
└── README.md                       # 이 파일
```

## 테스트 시작하기

### 1. 백엔드 테스트 실행

```bash
# Service-Account 단위 테스트
cd service-account
./gradlew test

# 커버리지 리포트 생성
./gradlew jacocoTestReport

# 리포트 확인
open build/reports/jacoco/test/html/index.html
```

### 2. 프론트엔드 테스트 실행

```bash
# 단위 테스트
cd frontend
npm test

# 커버리지 포함
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 기술 스택

### 백엔드

- JUnit 5 + Mockito (단위 테스트)
- Testcontainers (통합 테스트)
- REST-assured (API 테스트)
- JaCoCo (커버리지)
- Checkstyle (코드 스타일)

### 프론트엔드

- Jest + React Testing Library (단위 테스트)
- MSW (API Mocking)
- Playwright (E2E 테스트)
- ESLint + Prettier (코드 품질)

## CI/CD 파이프라인

### Pull Request

```
Lint → Unit Test → Build (4분)
```

### Dev 배포

```
Build → Integration Test → Deploy (10분)
```

### Stage 배포

```
E2E Test → Performance Test → Deploy (15분)
```

### Production 배포

```
Manual Approval → Smoke Test → Deploy (5분)
```

## 유용한 명령어

### 백엔드

```bash
# 전체 테스트 + 커버리지
./gradlew clean test jacocoTestReport

# Checkstyle 검사
./gradlew checkstyleMain checkstyleTest

# 통합 테스트만
./gradlew integrationTest

# 빌드
./gradlew build
```

### 프론트엔드

```bash
# 테스트 + 커버리지
npm run test:coverage

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# E2E
npm run test:e2e
npm run test:e2e -- --ui  # UI 모드

# 빌드
npm run build
```
