import { expect } from "@playwright/test";

/**
 * DealListPage - Page Object Model
 *
 * 거래 목록 페이지의 요소와 액션을 캡슐화
 */
export class DealListPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.purchaseTab = page.getByRole("tab", { name: /구매|구매내역|구매 내역/i });
    this.salesTab = page.getByRole("tab", { name: /판매|판매내역|판매 내역/i });
    this.dealCards = page.locator('[data-testid="deal-card"], .MuiCard-root, [class*="deal-card"]');
    this.emptyMessage = page.getByText(/거래가 없습니다|거래 내역이 없습니다/i);
    this.loadingIndicator = page.locator('[role="progressbar"], .MuiCircularProgress-root');
  }

  /**
   * 거래 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/deals");
    await this.page.waitForLoadState("networkidle");
    await this.waitForDealsToLoad();
  }

  /**
   * 거래 목록이 로드될 때까지 대기
   */
  async waitForDealsToLoad() {
    await this.page.waitForLoadState("networkidle");
    
    // 로딩 인디케이터가 사라질 때까지 대기
    await this.loadingIndicator.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    
    // 거래 카드가 있거나 빈 메시지가 나타날 때까지 대기
    await Promise.race([
      this.dealCards.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.emptyMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * 구매 내역 탭 클릭
   */
  async clickPurchaseTab() {
    await this.purchaseTab.click();
    await this.waitForDealsToLoad();
  }

  /**
   * 판매 내역 탭 클릭
   */
  async clickSalesTab() {
    await this.salesTab.click();
    await this.waitForDealsToLoad();
  }

  /**
   * 거래 개수 반환
   */
  async getDealCount() {
    return await this.dealCards.count();
  }

  /**
   * 첫 번째 거래 클릭
   */
  async clickFirstDeal() {
    const count = await this.getDealCount();
    if (count > 0) {
      await this.dealCards.first().click();
      await this.page.waitForURL(/\/deals\/\d+\/detail/, { timeout: 10000 });
    } else {
      throw new Error("거래가 없습니다");
    }
  }

  /**
   * 거래 목록이 비어있는지 확인
   */
  async expectEmpty() {
    await expect(this.emptyMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * 거래가 표시되는지 확인
   */
  async expectDealsVisible() {
    const count = await this.getDealCount();
    expect(count).toBeGreaterThan(0);
  }
}

