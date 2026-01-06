# Passit E2E 테스트 가이드

## 📋 목차

1. [개요](#개요)
2. [환경 설정](#환경-설정)
3. [테스트 실행](#테스트-실행)
4. [테스트 작성 가이드](#테스트-작성-가이드)
5. [Page Object Pattern](#page-object-pattern)
6. [베스트 프랙티스](#베스트-프랙티스)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

Passit 프로젝트는 **Playwright**를 사용하여 E2E(End-to-End) 테스트를 작성하고 있습니다.

### 기술 스택

- **Playwright**: 크로스 브라우저 E2E 테스트 프레임워크
- **Page Object Pattern**: 테스트 코드의 재사용성과 유지보수성 향상
- **JavaScript/ES6**: 테스트 코드 작성 언어

### 테스트 구조

```
frontend/e2e/
├── pages/                    # Page Object 클래스들
│   ├── LoginPage.js
│   ├── SignupPage.js
│   ├── TicketListPage.js
│   ├── TicketCreatePage.js
│   ├── TicketDetailPage.js
│   ├── DashboardPage.js
│   ├── ChatListPage.js       # 채팅 목록 페이지
│   ├── ChatRoomPage.js       # 채팅방 페이지
│   ├── DealListPage.js       # 거래 목록 페이지
│   └── DealAcceptPage.js     # 거래 수락 페이지
├── user-auth.spec.js         # 사용자 인증 플로우 테스트
├── ticket-create.spec.js     # 티켓 생성 테스트
├── ticket-list.spec.js       # 티켓 목록 조회 테스트
├── ticket-flow.spec.js       # 티켓 전체 플로우 테스트
├── chat-flow.spec.js         # 채팅 플로우 테스트
├── deal-flow.spec.js         # 거래/양도 플로우 테스트
└── README.md                 # 이 파일
```

---

## 환경 설정

### 1. 필수 요구사항

- Node.js 16 이상
- npm 또는 yarn
- Chrome, Firefox 브라우저 (Playwright가 자동 설치)

### 2. 의존성 설치

```bash
cd frontend
npm install
```

### 3. Playwright 브라우저 설치

```bash
npx playwright install
```

또는 특정 브라우저만 설치:

```bash
npx playwright install chromium
npx playwright install firefox
```

### 4. 환경 변수 설정

`.env` 파일을 생성하거나 환경 변수를 설정합니다:

```bash
# 로컬 개발 환경
BASE_URL=http://localhost:3000

# 개발 서버
BASE_URL=http://passit-dev-alb-1898503115.ap-northeast-2.elb.amazonaws.com

# 프로덕션 서버
BASE_URL=https://di1d1oxqewykn.cloudfront.net
```

---

## 테스트 실행

### 기본 실행

```bash
# 모든 테스트 실행
npm run test:e2e

# 특정 테스트 파일만 실행
npx playwright test user-auth.spec.js

# 특정 테스트만 실행 (태그 사용)
npx playwright test --grep "회원가입"
```

### 헤드 모드 (브라우저 창 표시)

```bash
npm run test:e2e:headed
```

### UI 모드 (인터랙티브 모드)

```bash
npm run test:e2e:ui
```

UI 모드에서는:

- 테스트를 선택적으로 실행 가능
- 실시간으로 테스트 진행 상황 확인
- 디버깅에 유용

### 프로덕션 환경 테스트

```bash
npm run test:e2e:prod
```

### 특정 브라우저로 실행

```bash
# Chrome만 실행
npx playwright test --project=chromium

# Firefox만 실행
npx playwright test --project=firefox
```

### 디버그 모드

```bash
# 디버그 모드로 실행 (Playwright Inspector 열림)
npx playwright test --debug

# 특정 테스트만 디버그
npx playwright test user-auth.spec.js --debug
```

### 테스트 리포트 확인

```bash
# HTML 리포트 열기
npx playwright show-report
```

---

## 테스트 작성 가이드

### 기본 구조

```javascript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("테스트 그룹 이름", () => {
  test("테스트 케이스 이름", async ({ page }) => {
    // 테스트 코드 작성
  });
});
```

### 예제: 간단한 테스트 작성

```javascript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("로그인 테스트", () => {
  test("유효한 이메일과 비밀번호로 로그인 성공", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. 로그인 페이지로 이동
    await loginPage.goto();

    // 2. 로그인 수행
    await loginPage.login("test@example.com", "Password123!");

    // 3. 로그인 성공 확인
    await expect(page).toHaveURL(/\/dashboard|\/home/);
  });
});
```

### 테스트 훅 사용

```javascript
test.describe("티켓 테스트", () => {
  let loginPage;
  let testEmail;
  let testPassword;

  // 각 테스트 전에 실행
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    testEmail = `test-${Date.now()}@example.com`;
    testPassword = "Test1234!";

    // 테스트 계정 생성
    await createTestAccount(testEmail, testPassword);
  });

  // 각 테스트 후에 실행
  test.afterEach(async ({ page }) => {
    // 테스트 데이터 정리
    await cleanupTestData(testEmail);
  });

  // 모든 테스트 전에 한 번만 실행
  test.beforeAll(async () => {
    // 공통 설정
  });

  // 모든 테스트 후에 한 번만 실행
  test.afterAll(async () => {
    // 정리 작업
  });

  test("티켓 생성 테스트", async ({ page }) => {
    // 테스트 코드
  });
});
```

### 고유한 테스트 데이터 생성

```javascript
test("회원가입 테스트", async ({ page }) => {
  // 타임스탬프를 사용하여 고유한 이메일 생성
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "Password123!";

  // 또는 UUID 사용
  const { randomUUID } = require("crypto");
  const uniqueEmail = `test-${randomUUID()}@example.com`;
});
```

### 비동기 작업 대기

```javascript
// 네트워크 요청 완료 대기
await page.waitForLoadState("networkidle");

// 특정 요소가 나타날 때까지 대기
await page.waitForSelector(".ticket-card", { state: "visible" });

// 특정 URL로 이동할 때까지 대기
await page.waitForURL(/\/tickets\/\d+/);

// 특정 시간 대기 (가급적 사용 지양)
await page.waitForTimeout(1000);
```

### Assertion 사용

```javascript
import { expect } from "@playwright/test";

// URL 확인
await expect(page).toHaveURL(/\/dashboard/);

// 텍스트 확인
await expect(page.getByText("로그인 성공")).toBeVisible();

// 요소 존재 확인
await expect(page.locator(".ticket-card")).toHaveCount(5);

// 속성 확인
await expect(page.locator('input[name="email"]')).toHaveValue("test@example.com");

// 스크린샷 비교 (시각적 회귀 테스트)
await expect(page).toHaveScreenshot("ticket-list.png");
```

---

## Page Object Pattern

### Page Object란?

Page Object Pattern은 웹 페이지의 요소와 액션을 클래스로 캡슐화하여 테스트 코드의 재사용성과 유지보수성을 높이는 디자인 패턴입니다.

### Page Object 작성 예제

```javascript
// e2e/pages/TicketListPage.js
import { expect } from "@playwright/test";

export class TicketListPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자 정의
    this.searchInput = page.locator('input[placeholder*="검색"]');
    this.ticketCards = page.locator(".ticket-card");
    this.emptyMessage = page.getByText("티켓이 없습니다");
  }

  /**
   * 티켓 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/tickets");
    await this.page.waitForLoadState("networkidle");
    await this.searchInput.waitFor({ state: "visible" });
  }

  /**
   * 티켓 검색
   */
  async search(keyword) {
    await this.searchInput.fill(keyword);
    await this.page.keyboard.press("Enter");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 티켓 개수 반환
   */
  async getTicketCount() {
    return await this.ticketCards.count();
  }

  /**
   * 첫 번째 티켓 클릭
   */
  async clickFirstTicket() {
    await this.ticketCards.first().click();
    await this.page.waitForURL(/\/tickets\/\d+/);
  }

  /**
   * 티켓 목록이 로드될 때까지 대기
   */
  async waitForTicketsToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 티켓이 있거나 빈 메시지가 나타날 때까지 대기
    await Promise.race([
      this.ticketCards
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {}),
      this.emptyMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
    ]);
  }
}
```

### Page Object 사용 예제

```javascript
import { test, expect } from "@playwright/test";
import { TicketListPage } from "./pages/TicketListPage";

test.describe("티켓 목록 테스트", () => {
  test("티켓 목록 조회", async ({ page }) => {
    const ticketListPage = new TicketListPage(page);

    // 페이지 이동
    await ticketListPage.goto();

    // 티켓 로드 대기
    await ticketListPage.waitForTicketsToLoad();

    // 티켓 개수 확인
    const count = await ticketListPage.getTicketCount();
    expect(count).toBeGreaterThan(0);
  });
});
```

### 기존 Page Object 확인

다음 파일들을 참고하여 새로운 Page Object를 작성하세요:

**인증 관련:**

- `e2e/pages/LoginPage.js` - 로그인 페이지
- `e2e/pages/SignupPage.js` - 회원가입 페이지

**티켓 관련:**

- `e2e/pages/TicketListPage.js` - 티켓 목록 페이지
- `e2e/pages/TicketCreatePage.js` - 티켓 생성 페이지
- `e2e/pages/TicketDetailPage.js` - 티켓 상세 페이지

**채팅 관련:**

- `e2e/pages/ChatListPage.js` - 채팅 목록 페이지
- `e2e/pages/ChatRoomPage.js` - 채팅방 페이지

**거래 관련:**

- `e2e/pages/DealListPage.js` - 거래 목록 페이지
- `e2e/pages/DealAcceptPage.js` - 거래 수락/상세 페이지

---

## 베스트 프랙티스

### 1. 독립적인 테스트 작성

각 테스트는 다른 테스트에 의존하지 않아야 합니다.

```javascript
// ❌ 나쁜 예: 다른 테스트에 의존
test("테스트 1", async ({ page }) => {
  await createTicket(page);
});

test("테스트 2", async ({ page }) => {
  // 테스트 1에서 생성한 티켓에 의존
  await viewTicket(page);
});

// ✅ 좋은 예: 각 테스트가 독립적
test("티켓 생성", async ({ page }) => {
  const ticketPage = new TicketCreatePage(page);
  await ticketPage.goto();
  await ticketPage.createTicket({ title: "Test Ticket" });
});

test("티켓 조회", async ({ page }) => {
  // 테스트 데이터를 직접 생성
  const ticketId = await createTestTicket();
  const detailPage = new TicketDetailPage(page);
  await detailPage.goto(ticketId);
});
```

### 2. 명확한 테스트 이름

테스트 이름은 무엇을 테스트하는지 명확하게 표현해야 합니다.

```javascript
// ❌ 나쁜 예
test("테스트 1", async ({ page }) => {});

// ✅ 좋은 예
test("유효한 이메일과 비밀번호로 로그인 성공", async ({ page }) => {});
test("존재하지 않는 이메일로 로그인 시도 시 에러 메시지 표시", async ({ page }) => {});
```

### 3. 적절한 대기 시간 사용

`waitForTimeout` 대신 `waitForSelector`, `waitForLoadState` 등을 사용하세요.

```javascript
// ❌ 나쁜 예
await page.waitForTimeout(5000); // 고정된 시간 대기

// ✅ 좋은 예
await page.waitForLoadState("networkidle"); // 네트워크 요청 완료 대기
await page.waitForSelector(".ticket-card", { state: "visible" }); // 요소 나타날 때까지 대기
```

### 4. 재사용 가능한 헬퍼 함수 작성

공통 로직은 헬퍼 함수로 분리하세요.

```javascript
// e2e/helpers/auth.js
export async function loginAsTestUser(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("test@example.com", "Password123!");
  await page.waitForLoadState("networkidle");
}

// 테스트에서 사용
import { loginAsTestUser } from "./helpers/auth";

test("티켓 생성", async ({ page }) => {
  await loginAsTestUser(page);
  // 테스트 코드 계속...
});
```

### 5. 에러 처리

테스트에서 예상되는 에러는 적절히 처리하세요.

```javascript
test("에러 메시지 확인", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("invalid@example.com", "wrongpassword");

  // 에러 메시지가 나타날 때까지 대기
  await loginPage.expectErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다");
});
```

### 6. 스크린샷과 비디오 활용

실패한 테스트의 스크린샷과 비디오는 자동으로 저장됩니다. `playwright.config.js`에서 설정 확인:

```javascript
use: {
  screenshot: 'only-on-failure',  // 실패 시에만 스크린샷
  video: 'retain-on-failure',      // 실패 시에만 비디오 저장
}
```

---

## 트러블슈팅

### 문제: "Element not found" 에러

**원인**: 요소가 아직 로드되지 않았거나 선택자가 잘못됨

**해결**:

```javascript
// 요소가 나타날 때까지 명시적으로 대기
await page.waitForSelector('.ticket-card', { state: 'visible', timeout: 10000 });

// 또는 Page Object에서 대기 로직 추가
async waitForElement() {
  await this.ticketCard.waitFor({ state: 'visible', timeout: 10000 });
}
```

### 문제: "Timeout" 에러

**원인**: 네트워크 요청이 너무 오래 걸리거나 무한 대기 상태

**해결**:

```javascript
// 타임아웃 시간 증가
await page.waitForSelector(".element", { timeout: 30000 });

// 또는 네트워크 요청 완료 대기
await page.waitForLoadState("networkidle");
```

### 문제: 테스트가 불안정하게 실패함

**원인**: 타이밍 이슈 또는 비동기 작업 미완료

**해결**:

```javascript
// 명시적인 대기 추가
await page.waitForLoadState("networkidle");
await page.waitForSelector('.element', { state: 'visible' });

// 또는 retry 옵션 사용 (playwright.config.js)
retries: process.env.CI ? 2 : 0,
```

### 문제: 로컬에서는 통과하지만 CI에서 실패

**원인**: 환경 차이 (네트워크 속도, 리소스 등)

**해결**:

```javascript
// CI 환경에서 더 긴 타임아웃 사용
const timeout = process.env.CI ? 30000 : 10000;
await page.waitForSelector(".element", { timeout });
```

### 문제: 브라우저가 열리지 않음

**해결**:

```bash
# Playwright 브라우저 재설치
npx playwright install --force
```

### 문제: 테스트 데이터 충돌

**원인**: 여러 테스트가 같은 데이터를 사용

**해결**:

```javascript
// 고유한 테스트 데이터 생성
const testEmail = `test-${Date.now()}@example.com`;
const ticketTitle = `Test Ticket ${Date.now()}`;
```

---

## 추가 리소스

### 공식 문서

- [Playwright 공식 문서](https://playwright.dev/)
- [Playwright API 레퍼런스](https://playwright.dev/docs/api/class-playwright)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### 유용한 명령어

```bash
# 테스트 코드 생성 (Codegen)
npx playwright codegen http://localhost:3000

# 테스트 추적 (Trace)
npx playwright test --trace on

# 스크린샷 비교
npx playwright test --update-snapshots
```

### 도움 요청

테스트 작성 중 문제가 발생하면:

1. 이 가이드의 [트러블슈팅](#트러블슈팅) 섹션 확인
2. 기존 테스트 코드 참고 (`e2e/*.spec.js`)
3. 팀 채널에서 질문

---

## 테스트 시나리오

### 사용 가능한 테스트

1. **사용자 인증 플로우** (`user-auth.spec.js`)

   - 회원가입 → 로그인 전체 플로우
   - 기존 사용자 로그인
   - 로그아웃

2. **티켓 플로우** (`ticket-create.spec.js`, `ticket-list.spec.js`, `ticket-flow.spec.js`)

   - 티켓 등록
   - 티켓 목록 조회
   - 티켓 상세 조회
   - 티켓 전체 플로우 (등록 → 조회)

3. **채팅 플로우** (`chat-flow.spec.js`) ⭐ 새로 추가

   - 티켓 상세에서 채팅 시작
   - 채팅방 목록 조회
   - 채팅방 입장 및 메시지 전송
   - 채팅방 나가기

4. **거래/양도 플로우** (`deal-flow.spec.js`) ⭐ 새로 추가
   - 티켓 상세에서 거래 요청
   - 거래 목록 조회 (구매/판매)
   - 거래 상세 조회
   - 거래 수락/거절 (판매자)
   - 거래 확정 (구매자)

### 테스트 실행 예제

```bash
# 채팅 플로우만 실행
npx playwright test chat-flow.spec.js

# 거래 플로우만 실행
npx playwright test deal-flow.spec.js

# 특정 테스트만 실행
npx playwright test chat-flow.spec.js -g "채팅방 입장"
```

## 체크리스트

새로운 테스트를 작성할 때:

- [ ] Page Object Pattern 사용
- [ ] 명확한 테스트 이름 작성
- [ ] 독립적인 테스트 데이터 사용
- [ ] 적절한 대기 시간 설정
- [ ] 에러 케이스도 테스트
- [ ] 로컬과 CI 환경 모두에서 테스트

---

**마지막 업데이트**: 2025-01-06
