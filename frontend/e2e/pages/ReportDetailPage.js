import { expect } from "@playwright/test";

/**
 * ReportDetailPage - Page Object Model
 *
 * 신고 상세 페이지의 요소와 액션을 캡슐화
 */
export class ReportDetailPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.reason = page.locator('h1, h2, h3, strong').filter({ hasText: /사유|reason/i }).or(page.getByText(/사유/i));
    this.content = page.locator('[class*="content"], [class*="body"], p').filter({ hasText: /./ });
    this.status = page.getByText(/상태|status/i).or(page.locator('strong').filter({ hasText: /상태/i }));
    this.backButton = page.getByRole("button", { name: /목록|back|←/i });
  }

  /**
   * 신고 상세 페이지로 이동
   */
  async goto(reportId) {
    await this.page.goto(`/cs/reports/${reportId}`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 사유나 내용이 나타날 때까지 대기
    await Promise.race([
      this.reason.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      this.content.waitFor({ state: "visible", timeout: 10000 }).catch(() => {})
    ]);
  }

  /**
   * 신고 정보가 표시되는지 확인
   */
  async expectReportInfoVisible() {
    // 사유 또는 내용 중 하나는 보여야 함
    const reasonVisible = await this.reason.isVisible({ timeout: 5000 }).catch(() => false);
    const contentVisible = await this.content.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(reasonVisible || contentVisible).toBeTruthy();
  }

  /**
   * 뒤로가기
   */
  async goBack() {
    if (await this.backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.backButton.click();
    } else {
      await this.page.goBack();
    }
    await this.page.waitForLoadState("networkidle");
  }
}

