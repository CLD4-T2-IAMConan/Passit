import { expect } from "@playwright/test";

/**
 * InquiryCreatePage - Page Object Model
 *
 * 문의 생성 페이지의 요소와 액션을 캡슐화
 */
export class InquiryCreatePage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.titleInput = page.locator('input[name="title"], input[placeholder*="제목"], textarea[name="title"]').first();
    this.contentInput = page.locator('textarea[name="content"], textarea[placeholder*="내용"], textarea').last();
    this.submitButton = page.getByRole("button", { name: /등록|제출|문의.*등록|submit/i });
    this.cancelButton = page.getByRole("button", { name: /취소|cancel/i });
    this.pageTitle = page.getByRole("heading", { name: /문의|문의하기/i });
  }

  /**
   * 문의 생성 페이지로 이동
   */
  async goto() {
    await this.page.goto("/cs/inquiries/new");
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageToLoad();
  }

  /**
   * 페이지가 로드될 때까지 대기
   */
  async waitForPageToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 제목 입력창이 나타날 때까지 대기
    await this.titleInput.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  /**
   * 문의 생성
   */
  async createInquiry(title, content) {
    await this.titleInput.waitFor({ state: "visible", timeout: 5000 });
    await this.titleInput.fill(title);

    await this.contentInput.waitFor({ state: "visible", timeout: 5000 });
    await this.contentInput.fill(content);

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
    await expect(this.titleInput).toBeVisible({ timeout: 10000 });
    await expect(this.contentInput).toBeVisible({ timeout: 10000 });
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }
}

