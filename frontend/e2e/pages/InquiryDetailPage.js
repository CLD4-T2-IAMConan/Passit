import { expect } from "@playwright/test";

/**
 * InquiryDetailPage - Page Object Model
 *
 * 문의 상세 페이지의 요소와 액션을 캡슐화
 */
export class InquiryDetailPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.title = page.locator('h1, h2, h3').first().or(page.getByText(/제목/i).locator('..'));
    this.content = page.locator('[class*="content"], [class*="body"], p').filter({ hasText: /./ });
    this.status = page.getByText(/상태|status/i).or(page.locator('strong').filter({ hasText: /상태/i }));
    this.answer = page.getByText(/답변|answer/i).or(page.locator('h3').filter({ hasText: /답변/i }));
    this.backButton = page.getByRole("button", { name: /목록|back|←/i });
  }

  /**
   * 문의 상세 페이지로 이동
   */
  async goto(inquiryId) {
    await this.page.goto(`/cs/inquiries/${inquiryId}`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 제목이나 내용이 나타날 때까지 대기
    await Promise.race([
      this.title.waitFor({ state: "visible", timeout: 10000 }).catch(() => {}),
      this.content.waitFor({ state: "visible", timeout: 10000 }).catch(() => {})
    ]);
  }

  /**
   * 문의 정보가 표시되는지 확인
   */
  async expectInquiryInfoVisible() {
    // 제목 또는 내용 중 하나는 보여야 함
    const titleVisible = await this.title.isVisible({ timeout: 5000 }).catch(() => false);
    const contentVisible = await this.content.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(titleVisible || contentVisible).toBeTruthy();
  }

  /**
   * 답변이 표시되는지 확인
   */
  async expectAnswerVisible() {
    await expect(this.answer).toBeVisible({ timeout: 5000 });
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

