import { expect } from "@playwright/test";

/**
 * DealAcceptPage - Page Object Model
 *
 * 거래 수락/상세 페이지의 요소와 액션을 캡슐화
 */
export class DealAcceptPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.acceptButton = page.getByRole("button", { name: /수락|거래 수락|accept/i });
    this.rejectButton = page.getByRole("button", { name: /거절|거래 거절|reject/i });
    this.confirmButton = page.getByRole("button", { name: /확정|거래 확정|confirm/i });
    this.cancelButton = page.getByRole("button", { name: /취소|cancel/i });
    this.dealInfo = page.locator('[data-testid="deal-info"], [class*="deal-detail"]');
    this.ticketInfo = page.locator('[data-testid="ticket-info"], [class*="ticket-info"]');
    this.priceInfo = page.locator('[data-testid="price-info"], [class*="price"]');
    this.statusBadge = page.locator('[data-testid="deal-status"], [class*="status"], .MuiChip-root');
  }

  /**
   * 거래 상세 페이지로 이동
   */
  async goto(dealId) {
    await this.page.goto(`/deals/${dealId}/detail`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 거래 정보가 나타날 때까지 대기
    await this.dealInfo.or(this.ticketInfo).waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  /**
   * 거래 수락
   */
  async acceptDeal() {
    await this.acceptButton.waitFor({ state: "visible", timeout: 5000 });
    await this.acceptButton.click();
    await this.page.waitForLoadState("networkidle");
    
    // 확인 다이얼로그가 나타날 수 있음
    const confirmDialog = this.page.getByRole("button", { name: /확인|ok|yes/i });
    if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmDialog.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * 거래 거절
   */
  async rejectDeal(reason = "테스트 거절 사유") {
    await this.rejectButton.waitFor({ state: "visible", timeout: 5000 });
    await this.rejectButton.click();
    await this.page.waitForLoadState("networkidle");
    
    // 거절 사유 입력 다이얼로그가 나타날 수 있음
    const reasonInput = this.page.locator('textarea, input[type="text"]').filter({ hasText: /사유|reason/i });
    if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reasonInput.fill(reason);
      const confirmButton = this.page.getByRole("button", { name: /확인|거절|reject/i });
      await confirmButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * 거래 확정
   */
  async confirmDeal() {
    await this.confirmButton.waitFor({ state: "visible", timeout: 5000 });
    await this.confirmButton.click();
    await this.page.waitForLoadState("networkidle");
    
    // 확인 다이얼로그가 나타날 수 있음
    const confirmDialog = this.page.getByRole("button", { name: /확인|ok|yes/i });
    if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmDialog.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * 거래 취소
   */
  async cancelDeal() {
    await this.cancelButton.waitFor({ state: "visible", timeout: 5000 });
    await this.cancelButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 거래 정보가 표시되는지 확인
   */
  async expectDealInfoVisible() {
    await expect(this.dealInfo.or(this.ticketInfo)).toBeVisible({ timeout: 10000 });
  }

  /**
   * 거래 상태 확인
   */
  async getDealStatus() {
    if (await this.statusBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await this.statusBadge.textContent();
    }
    return null;
  }

  /**
   * 특정 상태인지 확인
   */
  async expectStatus(status) {
    const currentStatus = await this.getDealStatus();
    expect(currentStatus).toContain(status);
  }
}

