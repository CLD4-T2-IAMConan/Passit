import { expect } from "@playwright/test";

/**
 * ReportListPage - Page Object Model
 *
 * 신고 목록 페이지의 요소와 액션을 캡슐화
 */
export class ReportListPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.reportList = page.locator('ul, [class*="report-list"], .MuiList-root');
    this.reportItems = page.locator('li, [class*="report-item"], .MuiListItem-root');
    this.createButton = page.getByRole("button", { name: /신고하기|신고.*등록|새.*신고/i });
    this.emptyMessage = page.getByText(/등록된 신고가 없습니다|신고가 없습니다/i);
    this.pageTitle = page.getByRole("heading", { name: /신고|신고 목록/i });
  }

  /**
   * 신고 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/cs/reports");
    await this.page.waitForLoadState("networkidle");
    await this.waitForReportsToLoad();
  }

  /**
   * 신고 목록이 로드될 때까지 대기
   */
  async waitForReportsToLoad() {
    await this.page.waitForLoadState("networkidle");
    
    // 신고가 있거나 빈 메시지가 나타날 때까지 대기
    await Promise.race([
      this.reportItems.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.emptyMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.pageTitle.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * 신고 개수 반환
   */
  async getReportCount() {
    return await this.reportItems.count();
  }

  /**
   * 첫 번째 신고 클릭
   */
  async clickFirstReport() {
    const count = await this.getReportCount();
    if (count > 0) {
      await this.reportItems.first().click();
      await this.page.waitForURL(/\/cs\/reports\/\d+/, { timeout: 10000 });
    } else {
      throw new Error("신고가 없습니다");
    }
  }

  /**
   * 신고하기 버튼 클릭
   */
  async clickCreateButton() {
    await this.createButton.waitFor({ state: "visible", timeout: 5000 });
    await this.createButton.click();
    await this.page.waitForURL(/\/cs\/reports\/new/, { timeout: 10000 });
  }

  /**
   * 신고 목록이 비어있는지 확인
   */
  async expectEmpty() {
    await expect(this.emptyMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * 신고가 표시되는지 확인
   */
  async expectReportsVisible() {
    const count = await this.getReportCount();
    expect(count).toBeGreaterThan(0);
  }
}

