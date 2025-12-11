import { expect } from "@playwright/test";

/**
 * SignupPage - Page Object Model
 *
 * 회원가입 페이지의 요소와 액션을 캡슐화
 */
export class SignupPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자 - name 속성이나 placeholder로 찾기
    this.emailInput = page
      .locator('input[name="email"], input[type="email"], input[placeholder*="이메일"]')
      .first();
    this.passwordInput = page
      .locator('input[name="password"], input[type="password"], input[placeholder*="비밀번호"]')
      .first();
    this.confirmPasswordInput = page
      .locator(
        'input[name="confirmPassword"], input[placeholder*="비밀번호 확인"], input[placeholder*="confirm"]'
      )
      .first();
    this.nameInput = page
      .locator('input[name="name"], input[placeholder*="이름"], input[placeholder*="name"]')
      .first();
    this.phoneInput = page
      .locator(
        'input[name="phone"], input[type="tel"], input[placeholder*="전화번호"], input[placeholder*="phone"]'
      )
      .first();
    this.submitButton = page.getByRole("button", { name: /회원가입/i });
    this.loginLink = page.getByText(/로그인/i).first();
    this.successMessage = page.getByText(/회원가입이 완료되었습니다|회원가입 완료/i);
    this.errorMessage = page.getByRole("alert");
  }

  /**
   * 회원가입 페이지로 이동
   */
  async goto() {
    await this.page.goto("/auth");
    await this.page.waitForLoadState("networkidle");

    // 로그인 폼이 먼저 나타날 수 있으므로, 회원가입 링크를 찾아 클릭
    // "회원가입" 또는 "가입하기" 텍스트를 가진 링크/버튼 찾기
    const signupLink = this.page.getByText(/회원가입/i).first();

    // 회원가입 모드로 전환
    try {
      await signupLink.waitFor({ state: "visible", timeout: 5000 });
      await signupLink.click();
      // 상태 변경 대기
      await this.page.waitForTimeout(500);
    } catch (e) {
      // 이미 회원가입 모드일 수 있음
    }

    // Step 0: 가입 방법 선택 화면이 나타날 수 있음
    // "이메일로 가입하기" 버튼이 있으면 클릭
    const emailSignupButton = this.page.getByRole("button", { name: /이메일로 가입하기/i });
    try {
      const isVisible = await emailSignupButton.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await emailSignupButton.click();
        await this.page.waitForTimeout(500);
      }
    } catch (e) {
      // 이미 이메일 인증 단계일 수 있음
    }

    // Step 1: 이메일 인증 단계의 이메일 입력 필드가 나타날 때까지 대기
    // 더 유연한 선택자 사용
    await this.page.waitForSelector(
      'input[name="email"], input[type="email"], input[placeholder*="이메일"]',
      { state: "visible", timeout: 10000 }
    );
  }

  /**
   * 회원가입 수행 (다단계 폼)
   */
  async signup({ email, password, name, phone = "" }) {
    // Step 1: 이메일 인증
    await this.emailInput.waitFor({ state: "visible", timeout: 5000 });
    await this.emailInput.fill(email);

    // 인증 코드 발송 버튼 클릭
    const sendCodeButton = this.page.getByRole("button", { name: /인증/i }).first();
    await sendCodeButton.waitFor({ state: "visible", timeout: 5000 });
    await sendCodeButton.click();
    await this.page.waitForTimeout(1000);

    // 인증 코드 입력 (테스트용 코드: 123456)
    const verificationCodeInput = this.page
      .locator('input[name="verificationCode"], input[placeholder*="인증 코드"]')
      .first();
    await verificationCodeInput.waitFor({ state: "visible", timeout: 5000 });
    await verificationCodeInput.fill("123456");

    // 확인 버튼 클릭
    const verifyButton = this.page.getByRole("button", { name: /확인/i }).first();
    await verifyButton.waitFor({ state: "visible", timeout: 5000 });
    await verifyButton.click();

    // 인증 완료 대기 - Step 2로 자동 이동
    await this.page.waitForTimeout(1000);

    // Step 2: 기본 정보 입력
    await this.nameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.nameInput.fill(name);

    // 닉네임 입력 (이름과 동일하게)
    const nicknameInput = this.page.locator('input[name="nickname"]').first();
    await nicknameInput.waitFor({ state: "visible", timeout: 5000 });
    await nicknameInput.fill(name);

    // "다음" 버튼 클릭하여 Step 3으로 이동
    const nextButton = this.page.getByRole("button", { name: /다음/i }).first();
    await nextButton.waitFor({ state: "visible", timeout: 5000 });
    await nextButton.click();
    await this.page.waitForTimeout(500);

    // Step 3: 비밀번호 입력
    await this.passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.passwordInput.fill(password);

    await this.confirmPasswordInput.waitFor({ state: "visible", timeout: 5000 });
    await this.confirmPasswordInput.fill(password);

    // 약관 동의 체크박스
    const termsCheckbox = this.page.locator('input[type="checkbox"]').first();
    await termsCheckbox.waitFor({ state: "visible", timeout: 5000 });
    await termsCheckbox.check();

    // 회원가입 버튼 클릭
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
    await this.submitButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 회원가입 성공 메시지 확인
   */
  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
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
   * 로그인 페이지로 이동
   */
  async goToLogin() {
    await this.loginLink.click();
  }
}
