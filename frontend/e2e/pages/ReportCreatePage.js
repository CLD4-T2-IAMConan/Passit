import { expect } from "@playwright/test";

/**
 * ReportCreatePage - Page Object Model
 *
 * 신고 생성 페이지의 요소와 액션을 캡슐화
 */
export class ReportCreatePage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.reasonInput = page.locator('input[name="reason"], textarea[name="reason"], input[placeholder*="사유"], textarea[placeholder*="사유"]').first();
    this.contentInput = page.locator('textarea[name="content"], textarea[name="description"], textarea').last();
    this.submitButton = page.getByRole("button", { name: /등록|제출|신고.*등록|submit/i });
    this.cancelButton = page.getByRole("button", { name: /취소|cancel/i });
    this.pageTitle = page.getByRole("heading", { name: /신고|신고하기/i });
  }

  /**
   * 신고 생성 페이지로 이동
   */
  async goto() {
    await this.page.goto("/cs/reports/new");
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 사유 입력창이 나타날 때까지 대기
    await this.reasonInput.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  /**
   * 신고 생성
   */
  async createReport(reason, content = "") {
    await this.reasonInput.waitFor({ state: "visible", timeout: 5000 });
    await this.reasonInput.fill(reason);

    if (content && await this.contentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.contentInput.fill(content);
    }

    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
    await this.submitButton.click();
    await this.page.waitForLoadState("networkidle");
    
    // 성공 메시지나 리다이렉트 대기
    await this.page.waitForTimeout(2000);
  }

  /**
   * 취소
   */
  async cancel() {
    if (await this.cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.cancelButton.click();
    } else {
      await this.page.goBack();
    }
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 폼이 올바르게 렌더링되었는지 확인
   */
  async expectFormRendered() {
    await expect(this.reasonInput).toBeVisible({ timeout: 10000 });
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }
}

