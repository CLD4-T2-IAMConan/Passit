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
    this.successMessage = page.getByText(/회원가입이 완료되었습니다|회원가입 완료|로그인해주세요/i);
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
    // 성공 메시지가 표시될 때까지 대기 (최대 10초)
    // 여러 패턴의 성공 메시지 텍스트를 시도
    const successPatterns = [
      /회원가입이 완료되었습니다/i,
      /회원가입 완료/i,
      /로그인해주세요/i,
      /완료되었습니다/i,
    ];

    let found = false;
    for (const pattern of successPatterns) {
      try {
        const messageElement = this.page.getByText(pattern).first();
        if (await messageElement.isVisible({ timeout: 5000 }).catch(() => false)) {
          found = true;
          await expect(messageElement).toBeVisible();
          break;
        }
      } catch (e) {
        // 다음 패턴 시도
      }
    }

    // 성공 메시지를 찾지 못한 경우, 로그인 폼으로 전환되었는지 확인
    if (!found) {
      // 페이지가 로그인 모드로 전환되었는지 확인
      // 회원가입 폼이 사라지고 로그인 폼이 나타나는지 확인
      await this.page.waitForTimeout(2000); // 상태 전환 대기
      
      // 회원가입 관련 요소가 사라졌는지 확인
      const signupFormVisible = await this.page
        .locator('input[placeholder*="이름"], input[name="name"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // 로그인 폼 요소 확인
      const loginEmailInput = this.page
        .locator('input[name="email"], input[type="email"], input[placeholder*="이메일"]')
        .first();
      const isLoginFormVisible = await loginEmailInput.isVisible({ timeout: 5000 }).catch(() => false);

      // 회원가입 폼이 사라지고 로그인 폼이 보이면 성공으로 간주
      if (!signupFormVisible && isLoginFormVisible) {
        found = true;
        return;
      }

      // MUI Alert 성공 메시지 확인
      const successAlert = this.page.locator('.MuiAlert-root[role="alert"]').filter({ hasText: /완료|성공|success/i }).first();
      if (await successAlert.isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        return;
      }
    }

    // 성공 메시지나 로그인 폼 중 하나라도 보이지 않으면 실패
    if (!found) {
      // 디버깅을 위해 현재 페이지 상태 확인
      const pageContent = await this.page.content();
      console.log("페이지 내용 일부:", pageContent.substring(0, 500));
      throw new Error("회원가입 성공 메시지 또는 로그인 폼을 찾을 수 없습니다.");
    }
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
