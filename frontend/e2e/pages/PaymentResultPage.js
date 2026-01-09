import { expect } from "@playwright/test";

/**
 * PaymentResultPage - Page Object Model
 *
 * 결제 결과 페이지의 요소와 액션을 캡슐화
 */
export class PaymentResultPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.processingMessage = page.getByText(/처리 중|결제 승인 정보를 처리 중/i);
    this.successMessage = page.getByText(/결제가 완료|결제가 성공적으로 완료/i);
    this.failMessage = page.getByText(/결제가 실패|결제 승인 오류/i);
    this.successIcon = page.locator('text=✅, [class*="success"], [class*="check"]');
    this.failIcon = page.locator('text=❌, [class*="fail"], [class*="error"]');
    this.homeButton = page.getByRole("button", { name: /메인|홈|home|돌아가기/i });
    this.retryButton = page.getByRole("button", { name: /재시도|retry/i });
  }

  /**
   * 결제 결과 페이지로 이동
   */
  async goto(paymentId, queryParams = {}) {
    const params = new URLSearchParams(queryParams);
    const queryString = params.toString();
    const url = `/payments/${paymentId}/result${queryString ? `?${queryString}` : ''}`;
    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 처리 중 상태 확인
   */
  async expectProcessing() {
    await expect(this.processingMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * 성공 상태 확인
   */
  async expectSuccess() {
    // 성공 메시지 또는 아이콘이 나타날 때까지 대기
    await Promise.race([
      expect(this.successMessage).toBeVisible({ timeout: 15000 }),
      expect(this.successIcon).toBeVisible({ timeout: 15000 })
    ]);
  }

  /**
   * 실패 상태 확인
   */
  async expectFailure() {
    // 실패 메시지 또는 아이콘이 나타날 때까지 대기
    await Promise.race([
      expect(this.failMessage).toBeVisible({ timeout: 15000 }),
      expect(this.failIcon).toBeVisible({ timeout: 15000 })
    ]);
  }

  /**
   * 홈으로 돌아가기 버튼 클릭
   */
  async clickHomeButton() {
    if (await this.homeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.homeButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * 재시도 버튼 클릭
   */
  async clickRetryButton() {
    if (await this.retryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.retryButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * 결제 상태 확인 (SUCCESS, FAILED, PROCESSING)
   */
  async getPaymentStatus() {
    if (await this.successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      return "SUCCESS";
    }
    if (await this.failMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      return "FAILED";
    }
    if (await this.processingMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      return "PROCESSING";
    }
    return "UNKNOWN";
  }
}

