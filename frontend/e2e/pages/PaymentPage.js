import { expect } from "@playwright/test";

/**
 * PaymentPage - Page Object Model
 *
 * 결제 페이지의 요소와 액션을 캡슐화
 */
export class PaymentPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.paymentInfo = page.locator('[data-testid="payment-info"], [class*="payment"]');
    this.ticketInfo = page.locator('[data-testid="ticket-info"], [class*="ticket"]');
    this.dealInfo = page.locator('[data-testid="deal-info"], [class*="deal"]');
    this.payButton = page.getByRole("button", { name: /결제|결제하기|pay/i });
    this.paymentModal = page.locator('[role="dialog"], .MuiModal-root, [class*="modal"]');
    this.confirmPaymentButton = page.getByRole("button", { name: /확인|결제 확인|confirm/i });
    this.cancelButton = page.getByRole("button", { name: /취소|cancel/i });
    this.loadingIndicator = page.locator('[role="progressbar"], .MuiCircularProgress-root');
    this.errorMessage = page.locator('[role="alert"], .MuiAlert-root, [class*="error"]');
  }

  /**
   * 결제 페이지로 이동
   */
  async goto(paymentId) {
    await this.page.goto(`/payments/${paymentId}/detail`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    
    // 로딩 인디케이터가 사라질 때까지 대기
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    
    // 결제 정보가 나타날 때까지 대기
    await Promise.race([
      this.paymentInfo.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      this.ticketInfo.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      this.errorMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * 결제 정보가 표시되는지 확인
   */
  async expectPaymentInfoVisible() {
    await expect(this.paymentInfo.or(this.ticketInfo)).toBeVisible({ timeout: 10000 });
  }

  /**
   * 결제 버튼 클릭
   */
  async clickPayButton() {
    await this.payButton.waitFor({ state: "visible", timeout: 5000 });
    await this.payButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 결제 모달이 나타나는지 확인
   */
  async expectPaymentModalVisible() {
    await expect(this.paymentModal).toBeVisible({ timeout: 5000 });
  }

  /**
   * 결제 확인 (모달에서)
   */
  async confirmPayment() {
    // 모달이 열려있는지 확인
    await this.expectPaymentModalVisible();
    
    // 결제 확인 버튼 클릭
    if (await this.confirmPaymentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.confirmPaymentButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment() {
    if (await this.cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.cancelButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * 에러 메시지 확인
   */
  async expectError(message) {
    if (message) {
      await expect(this.errorMessage).toContainText(message, { timeout: 5000 });
    } else {
      await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * 결제 금액 확인
   */
  async getPaymentAmount() {
    const amountText = await this.page.locator('[data-testid="amount"], [class*="amount"]').textContent().catch(() => null);
    return amountText;
  }
}

