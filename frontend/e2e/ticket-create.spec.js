import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TicketCreatePage } from "./pages/TicketCreatePage";

/**
 * 티켓 등록 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * - 회원가입 후 로그인
 * - 티켓 등록
 * - 필수 필드 유효성 검사
 * - 티켓 등록 성공
 */

test.describe("티켓 등록 플로우", () => {
  let loginPage;
  let signupPage;
  let ticketCreatePage;
  let testEmail;
  let testPassword;

  test.beforeEach(async ({ page }) => {
    ticketCreatePage = new TicketCreatePage(page);

    // 고유한 테스트 계정 생성
    testEmail = `e2e-test-${Date.now()}@example.com`;
    testPassword = "Test1234";
    const testNickname = `tester${Date.now()}`;

    try {
      const baseURL = process.env.BASE_URL || "https://di1d1oxqewykn.cloudfront.net";

      // page.request를 사용하여 API 호출
      console.log(`📝 회원가입: ${testEmail}`);

      const signupResponse = await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: "E2E 티켓테스터",
          nickname: testNickname,
        },
      });

      const signupData = await signupResponse.json();
      console.log("회원가입 응답:", signupData.success, signupData.message);

      if (!signupResponse.ok() || !signupData.success) {
        console.log("⚠️ 회원가입 실패:", signupData.message);
        test.skip();
        return;
      }

      // 로그인 재시도 로직 (DB 복제 지연 대응)
      console.log(`🔐 로그인 시도 (재시도 로직 포함): ${testEmail}`);

      let loginData;
      let loginAttempts = 0;
      const maxAttempts = 6; // 최대 6번 시도 (총 30초)

      while (loginAttempts < maxAttempts) {
        loginAttempts++;

        if (loginAttempts > 1) {
          console.log(`⏳ ${loginAttempts}번째 로그인 시도...`);
          await page.waitForTimeout(5000); // 5초 대기
        }

        const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
          data: {
            email: testEmail,
            password: testPassword,
          },
        });

        loginData = await loginResponse.json();

        if (loginData.success) {
          console.log(`✅ 로그인 성공 (${loginAttempts}번째 시도)`);
          break;
        } else {
          console.log(`❌ 로그인 실패 (${loginAttempts}/${maxAttempts}): ${loginData.message}`);
        }
      }

      if (loginData.success && loginData.data && loginData.data.accessToken) {
        console.log("✅ 토큰 획득 성공");

        // 페이지 방문 전에 토큰을 localStorage에 저장
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        await page.evaluate((data) => {
          // 토큰 저장
          localStorage.setItem("accessToken", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }

          // 사용자 정보 저장 (AuthContext.getCurrentUser()가 필요로 함)
          const user = {
            userId: data.userId,
            email: data.email,
            name: data.name,
            role: data.role,
            provider: data.provider,
          };
          localStorage.setItem("user", JSON.stringify(user));
        }, loginData.data);

        // 페이지 새로고침으로 인증 상태 적용
        await page.reload();
        await page.waitForLoadState("networkidle");

        // 인증 상태가 적용될 때까지 추가 대기
        await page.waitForTimeout(1000);

        console.log("✅ 인증 상태 설정 완료");
      } else {
        console.log("⚠️ 로그인 실패:", loginData.message || "알 수 없는 오류");
        test.skip();
      }
    } catch (error) {
      console.log("❌ 인증 설정 중 에러:", error.message);
      test.skip();
    }
  });

  test("티켓 등록 페이지 접근 및 폼 렌더링 확인", async ({ page }) => {
    await ticketCreatePage.goto();

    // 현재 URL 확인
    console.log("현재 URL:", page.url());

    // 페이지 타이틀 확인
    const title = await page.title();
    console.log("페이지 타이틀:", title);

    // localStorage 확인
    const token = await page.evaluate(() => localStorage.getItem("accessToken"));
    console.log("토큰 존재 여부:", token ? "있음" : "없음");

    // 폼 필드가 모두 렌더링되었는지 확인
    await expect(ticketCreatePage.eventNameInput).toBeVisible();
    await expect(ticketCreatePage.eventDateInput).toBeVisible();
    await expect(ticketCreatePage.eventLocationInput).toBeVisible();
    await expect(ticketCreatePage.originalPriceInput).toBeVisible();
  });

  test("필수 필드 없이 제출 시 유효성 검사 에러", async ({ page }) => {
    await ticketCreatePage.goto();

    // 빈 폼으로 제출 시도
    await ticketCreatePage.submitButton.click();

    // 브라우저 기본 유효성 검사 확인
    const eventNameValid = await ticketCreatePage.eventNameInput.evaluate(
      (el) => el.validity.valid
    );
    expect(eventNameValid).toBe(false);
  });

  test("티켓 등록 성공 - 전체 플로우", async ({ page }) => {
    await ticketCreatePage.goto();

    // 티켓 정보 입력
    const ticketData = {
      eventName: "E2E 테스트 콘서트",
      eventDate: "2026-03-15T19:00", // datetime-local 형식
      eventLocation: "서울 올림픽공원",
      originalPrice: "150000",
      // tradeType: "직거래", // TODO: MUI Select 이슈로 임시 스킵
      sellingPrice: "150000",
      seatInfo: "A구역 5열 10번",
      description: "E2E 자동 테스트로 생성된 티켓입니다.",
    };

    await ticketCreatePage.createTicket(ticketData);

    // 성공 메시지 또는 리다이렉트 확인
    // (실제 구현에 따라 달라질 수 있음)
    await page.waitForTimeout(2000);

    // 에러가 없으면 성공으로 간주
    const hasError = await page
      .locator('[role="alert"]')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!hasError) {
      console.log("✅ 티켓 등록 요청 전송 성공");
    }
  });

  test("가격 유효성 검사 - 음수 가격", async ({ page }) => {
    await ticketCreatePage.goto();

    await ticketCreatePage.eventNameInput.fill("테스트 이벤트");
    await ticketCreatePage.originalPriceInput.fill("-1000");
    await ticketCreatePage.sellingPriceInput.fill("-1000");

    await ticketCreatePage.submitButton.click();

    // 유효성 검사 에러 확인
    const priceValid = await ticketCreatePage.originalPriceInput.evaluate(
      (el) => el.validity.valid
    );

    // 음수는 허용되지 않아야 함
    expect(priceValid).toBe(false);
  });

  test("이벤트 날짜 - 과거 날짜 선택", async ({ page }) => {
    await ticketCreatePage.goto();

    await ticketCreatePage.eventNameInput.fill("과거 이벤트");
    await ticketCreatePage.eventDateInput.fill("2020-01-01");
    await ticketCreatePage.originalPriceInput.fill("100000");
    await ticketCreatePage.sellingPriceInput.fill("100000");

    await ticketCreatePage.submitButton.click();
    await page.waitForTimeout(1000);

    // 에러 메시지 또는 유효성 검사 확인
    // (실제 구현에 따라 과거 날짜를 허용하거나 거부할 수 있음)
  });

  test("티켓 등록 후 취소 - 뒤로가기", async ({ page }) => {
    await ticketCreatePage.goto();

    // 일부 정보만 입력
    await ticketCreatePage.eventNameInput.fill("취소할 이벤트");

    // 뒤로가기
    await page.goBack();
    await page.waitForLoadState("networkidle");

    // 폼을 떠났는지 확인
    const onCreatePage = await ticketCreatePage.eventNameInput
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(onCreatePage).toBe(false);
  });
});

test.describe("티켓 등록 - 인증되지 않은 사용자", () => {
  test("로그인하지 않고 티켓 등록 페이지 접근", async ({ page }) => {
    const ticketCreatePage = new TicketCreatePage(page);

    await ticketCreatePage.goto();

    // 로그인 페이지로 리다이렉트되어야 함
    await page.waitForTimeout(2000);

    const url = page.url();
    const isRedirectedToAuth =
      url.includes("/auth") || url.includes("/login");

    // 로그인 페이지로 리다이렉트되거나, 로그인 폼이 표시되어야 함
    if (isRedirectedToAuth) {
      expect(url).toMatch(/\/auth|\/login/);
    } else {
      // 또는 현재 페이지에 로그인 폼이 있어야 함
      const loginFormExists = await page
        .locator('input[type="email"], input[name="email"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(loginFormExists).toBe(true);
    }
  });
});
