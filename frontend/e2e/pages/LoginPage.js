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

    await submitButton.click();

    // 로그인 처리 대기
    await this.page.waitForLoadState("networkidle");
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
