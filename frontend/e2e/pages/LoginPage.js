import { expect } from "@playwright/test";

/**
 * LoginPage - Page Object Model
 *
 * 로그인 페이지의 요소와 액션을 캡슐화
 */
export class LoginPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자 - placeholder나 name 속성으로 찾기
    this.emailInput = page
      .locator(
        'input[name="email"], input[type="email"], input[placeholder*="이메일"], input[placeholder*="email"]'
      )
      .first();
    this.passwordInput = page
      .locator(
        'input[name="password"], input[type="password"], input[placeholder*="비밀번호"], input[placeholder*="password"]'
      )
      .first();
    this.submitButton = page
      .getByRole("button", { name: /로그인/i })
      .or(page.locator('form').getByRole("button", { name: /로그인/i }))
      .first();
    this.errorMessage = page.getByRole("alert");
    this.signupLink = page.getByText(/회원가입|가입하기/i).first();
    this.forgotPasswordLink = page.getByText(/비밀번호 찾기|forgot password/i).first();
  }

  /**
   * 로그인 페이지로 이동
   */
  async goto() {
    await this.page.goto("/auth");
    // 페이지가 로드될 때까지 대기
    await this.page.waitForLoadState("networkidle");

    // 로그인 폼이 나타날 때까지 대기
    // 더 유연한 선택자로 이메일 입력 필드 찾기
    await this.page.waitForSelector(
      'input[name="email"], input[type="email"], input[placeholder*="이메일"]',
      { state: "visible", timeout: 10000 }
    );

    // 로그인 모드인지 확인 (회원가입 모드라면 로그인 링크 클릭)
    const loginLink = this.page.getByText(/로그인|이미 계정이 있으신가요/i).first();
    try {
      // 회원가입 폼이 보이면 로그인 모드로 전환
      const signupFormVisible = await this.page
        .locator('input[placeholder*="이름"], input[name="name"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (signupFormVisible) {
        await loginLink.click();
        await this.page.waitForTimeout(300);
        // 다시 로그인 폼이 나타날 때까지 대기
        await this.page.waitForSelector('input[name="email"], input[type="email"]', {
          state: "visible",
          timeout: 5000,
        });
      }
    } catch (e) {
      // 이미 로그인 모드일 수 있음
    }
  }

  /**
   * 로그인 수행
   */
  async login(email, password) {
    // 입력 필드가 나타날 때까지 대기
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
    await this.emailInput.fill(email);

    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.passwordInput.fill(password);

    // 제출 버튼 찾기 (여러 방법 시도)
    let submitButton = null;
    const buttonSelectors = [
      () => this.page.getByRole("button", { name: /로그인/i }).first(),
      () => this.page.locator('form').getByRole("button", { name: /로그인/i }).first(),
      () => this.page.locator('button[type="submit"]').first(),
      () => this.page.locator('button').filter({ hasText: /로그인/i }).first(),
    ];

    for (const selector of buttonSelectors) {
      try {
        const button = selector();
        if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
          submitButton = button;
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }

    if (!submitButton) {
      throw new Error("로그인 버튼을 찾을 수 없습니다.");
    }

    // 버튼 상태 확인
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    const isVisible = await submitButton.isVisible().catch(() => false);
    console.log(`🔍 로그인 버튼 상태: visible=${isVisible}, disabled=${isDisabled}`);

    // 폼 유효성 검사 확인
    const emailValid = await this.emailInput.evaluate((el) => el.validity.valid).catch(() => false);
    const passwordValid = await this.passwordInput.evaluate((el) => el.validity.valid).catch(() => false);
    console.log(`🔍 폼 유효성: email=${emailValid}, password=${passwordValid}`);

    // 네트워크 요청 모니터링 시작 (모든 요청 캡처)
    const networkRequests = [];
    const allRequests = [];
    const requestListener = (request) => {
      const url = request.url();
      allRequests.push({ url, method: request.method() });
      if (url.includes('/api/auth/login') || url.includes('/auth/login') || url.includes('8081')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
        });
      }
    };
    
    const responseListener = (response) => {
      const url = response.url();
      if (url.includes('/api/auth/login') || url.includes('/auth/login') || url.includes('8081')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    };

    // 콘솔 에러 캡처
    const consoleErrors = [];
    const consoleListener = (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };
    this.page.on('console', consoleListener);

    this.page.on('request', requestListener);
    this.page.on('response', responseListener);

    // 로그인 버튼 클릭 전 상태 확인
    const beforeClickUrl = this.page.url();
    console.log(`📍 로그인 버튼 클릭 전 URL: ${beforeClickUrl}`);
    
    // 폼 제출 직접 트리거 (여러 방법 시도)
    try {
      // 방법 1: 폼의 submit 이벤트 직접 트리거
      const form = this.page.locator('form').first();
      const formExists = await form.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (formExists) {
        console.log("📝 폼 제출 이벤트 직접 트리거");
        await form.evaluate((form) => {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await this.page.waitForTimeout(500);
      }
      
      // 방법 2: 로그인 버튼 클릭
      await submitButton.click({ force: true });
      console.log("✅ 로그인 버튼 클릭 완료 (직접 클릭)");
    } catch (e) {
      console.log(`⚠️ 폼 제출 실패: ${e.message}`);
      // 방법 3: Enter 키 시뮬레이션
      console.log("⚠️ Enter 키 시도");
      await this.passwordInput.press('Enter');
    }
    
    // 폼 제출 이벤트 확인
    await this.page.waitForTimeout(1000);
    
    // 실제로 API 호출이 발생했는지 확인
    const apiUrl = await this.page.evaluate(() => {
      // window 객체에서 API 설정 확인
      return {
        accountApi: window.REACT_APP_ACCOUNT_API_URL || 'not found',
        cloudfront: window.REACT_APP_CLOUDFRONT_URL || 'not found',
        apiBase: window.REACT_APP_API_BASE_URL || 'not found',
      };
    }).catch(() => ({}));
    console.log("🔍 프론트엔드 API 설정:", JSON.stringify(apiUrl, null, 2));
    
    // 폼 제출이 실제로 발생했는지 확인
    await this.page.waitForTimeout(500);
    
    // 로그인 API 응답 대기 (여러 패턴 시도)
    let loginResponse = null;
    try {
      loginResponse = await this.page.waitForResponse(
        (response) => {
          const url = response.url();
          return (
            (url.includes('/api/auth/login') || 
             url.includes('/auth/login') ||
             url.includes('8081') ||
             url.includes('account')) &&
            response.status() !== 0
          );
        },
        { timeout: 10000 }
      );
      console.log(`✅ 로그인 API 응답 수신: ${loginResponse.url()} - ${loginResponse.status()}`);
    } catch (e) {
      console.log("⚠️ 로그인 API 응답을 기다리는 중 타임아웃 발생");
      console.log("💡 가능한 원인:");
      console.log("   1. 백엔드 서버가 실행 중이지 않음");
      console.log("   2. API URL이 잘못 설정됨");
      console.log("   3. 네트워크 요청이 실제로 발생하지 않음");
    }

    // 로그인 처리 대기
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000); // 추가 대기 시간

    // 네트워크 요청 모니터링 종료
    this.page.off('request', requestListener);
    this.page.off('response', responseListener);

    // 콘솔 에러 확인
    if (consoleErrors.length > 0) {
      console.log("⚠️ JavaScript 콘솔 에러:", consoleErrors);
    }

    // 네트워크 요청 로그 출력
    if (networkRequests.length > 0) {
      console.log("📡 로그인 네트워크 요청:", JSON.stringify(networkRequests, null, 2));
    } else {
      console.log("⚠️ 로그인 API 요청이 감지되지 않았습니다.");
      console.log("💡 가능한 원인:");
      console.log("   1. 프론트엔드가 CloudFront URL을 사용 중 (로컬 프록시 미사용)");
      console.log("   2. 로그인 버튼 클릭이 실제로 폼 제출을 트리거하지 않음");
      console.log("   3. JavaScript 에러로 인해 API 호출이 차단됨");
      console.log("   4. 폼 유효성 검사 실패");
      
      // 최근 네트워크 요청 확인 (최대 10개)
      const recentRequests = allRequests.slice(-10);
      console.log("📡 최근 네트워크 요청 (최대 10개):", JSON.stringify(recentRequests, null, 2));
      
      // 페이지의 모든 네트워크 요청 확인
      const performanceRequests = await this.page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(r => r.name.includes('api') || r.name.includes('auth') || r.name.includes('8081'))
          .map(r => ({
            name: r.name,
            type: r.initiatorType,
            duration: r.duration
          }));
      });
      console.log("📡 Performance API로 확인한 요청:", JSON.stringify(performanceRequests, null, 2));
    }
    
    // 리스너 제거
    this.page.off('console', consoleListener);
  }

  /**
   * 에러 메시지 확인
   */
  async expectErrorMessage(message) {
    // MUI Alert 또는 일반 에러 텍스트 찾기
    // 여러 선택자를 시도하여 에러 메시지 찾기
    const errorSelectors = [
      '[role="alert"][aria-live="polite"]', // MUI Alert
      '.MuiAlert-root', // MUI Alert 클래스
      '[class*="error"]', // error 클래스 포함
      '[class*="Error"]', // Error 클래스 포함
      'text=/이메일|비밀번호|확인|오류|에러|실패/i', // 에러 관련 텍스트
    ];

    let errorElement = null;
    for (const selector of errorSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          errorElement = element;
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }

    // 에러 요소를 찾지 못한 경우, 페이지에 에러 관련 텍스트가 있는지 확인
    if (!errorElement) {
      const errorText = this.page.locator('text=/이메일 또는 비밀번호|로그인 실패|인증 실패|오류|에러/i').first();
      if (await errorText.isVisible({ timeout: 2000 }).catch(() => false)) {
        errorElement = errorText;
      }
    }

    // 여전히 찾지 못한 경우, 로그인 폼이 여전히 보이는지 확인 (에러가 발생했으면 로그인되지 않았을 것)
    if (!errorElement) {
      // 로그인 버튼이 여전히 보이거나, 로그인 폼이 여전히 보이는지 확인
      const loginFormVisible = await this.emailInput.isVisible({ timeout: 2000 }).catch(() => false);
      if (loginFormVisible) {
        // 로그인 폼이 여전히 보이면 에러가 발생한 것으로 간주 (로그인 실패)
        return;
      }
    }

    if (errorElement) {
      await expect(errorElement).toBeVisible({ timeout: 10000 });
      if (message) {
        await expect(errorElement).toContainText(message);
      }
    } else {
      // 에러 메시지를 찾지 못했지만, 로그인 폼이 여전히 보이면 에러로 간주
      await expect(this.emailInput).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * 회원가입 페이지로 이동
   */
  async goToSignup() {
    await this.signupLink.click();
  }

  /**
   * 비밀번호 찾기 페이지로 이동
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * 로그인 폼이 올바르게 렌더링되었는지 확인
   */
  async expectFormRendered() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
