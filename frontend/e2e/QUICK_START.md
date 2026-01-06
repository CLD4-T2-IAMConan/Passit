# E2E 테스트 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1단계: 환경 설정 (최초 1회)

```bash
cd frontend
npm install
npx playwright install
```

### 2단계: 테스트 실행

```bash
# 모든 테스트 실행
npm run test:e2e

# 브라우저 창을 보면서 실행 (디버깅에 유용)
npm run test:e2e:headed

# UI 모드로 실행 (가장 추천!)
npm run test:e2e:ui
```

### 3단계: 첫 번째 테스트 작성

`e2e/my-first-test.spec.js` 파일 생성:

```javascript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("내 첫 번째 테스트", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await expect(page).toHaveTitle(/Passit/i);
});
```

실행:

```bash
npx playwright test my-first-test.spec.js
```

## 📝 자주 사용하는 명령어

```bash
# 특정 테스트만 실행
npx playwright test user-auth.spec.js

# 특정 브라우저로만 실행
npx playwright test --project=chromium

# 디버그 모드
npx playwright test --debug

# 테스트 리포트 보기
npx playwright show-report

# 코드 자동 생성 (매우 유용!)
npx playwright codegen http://localhost:3000
```

## 🎯 다음 단계

더 자세한 내용은 [README.md](./README.md)를 참고하세요!

- [테스트 작성 가이드](./README.md#테스트-작성-가이드)
- [Page Object Pattern](./README.md#page-object-pattern)
- [베스트 프랙티스](./README.md#베스트-프랙티스)
- [트러블슈팅](./README.md#트러블슈팅)

