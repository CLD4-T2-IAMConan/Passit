import { expect } from "@playwright/test";

/**
 * NoticePage - Page Object Model
 *
 * 공지사항 상세 페이지의 요소와 액션을 캡슐화
 */
export class NoticePage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.title = page.locator('h1, h2, h3').first();
    this.content = page.locator('[class*="content"], [class*="body"], div').filter({ hasText: /./ });
    this.backButton = page.getByRole("button", { name: /목록|back|←/i }).or(page.locator('button').filter({ hasText: /←/ }));
  }

  /**
   * 공지사항 상세 페이지로 이동
   */
  async goto(noticeId) {
    await this.page.goto(`/cs/notices/${noticeId}`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 제목이 나타날 때까지 대기
    await this.title.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  /**
   * 공지사항 정보가 표시되는지 확인
   */
  async expectNoticeInfoVisible() {
    await expect(this.title).toBeVisible({ timeout: 10000 });
    // 내용도 확인 (빈 내용일 수도 있으므로 선택적)
    const contentVisible = await this.content.isVisible({ timeout: 5000 }).catch(() => false);
    if (contentVisible) {
      await expect(this.content).toBeVisible();
    }
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

