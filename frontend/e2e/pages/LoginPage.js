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
    this.submitButton = page.locator('form').getByRole("button", { name: /로그인/i });
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

    // 제출 버튼이 활성화될 때까지 대기
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
    await this.submitButton.click();

    // 로그인 처리 대기
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 에러 메시지 확인
   */
  async expectErrorMessage(message) {
    // MUI Alert 또는 일반 에러 텍스트 찾기
    const errorElement = this.page.locator('[role="alert"], .MuiAlert-root, [class*="error"]').first();
    await expect(errorElement).toBeVisible({ timeout: 10000 });
    await expect(errorElement).toContainText(message);
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
