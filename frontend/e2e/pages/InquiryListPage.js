import { expect } from "@playwright/test";

/**
 * InquiryListPage - Page Object Model
 *
 * 문의 목록 페이지의 요소와 액션을 캡슐화
 */
export class InquiryListPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.inquiryList = page.locator('.MuiList-root, [class*="inquiry-list"], ul');
    this.inquiryItems = page.locator('.MuiListItem-root, [class*="inquiry-item"], li');
    this.createButton = page.getByRole("button", { name: /문의하기|문의.*등록|새.*문의/i });
    this.emptyMessage = page.getByText(/등록된 문의가 없습니다|문의가 없습니다/i);
    this.pageTitle = page.getByRole("heading", { name: /문의|문의 목록/i });
    this.refreshButton = page.getByRole("button", { name: /새로고침|refresh/i });
  }

  /**
   * 문의 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/cs/inquiries");
    await this.page.waitForLoadState("networkidle");
    await this.waitForInquiriesToLoad();
  }

  /**
   * 문의 목록이 로드될 때까지 대기
   */
  async waitForInquiriesToLoad() {
    await this.page.waitForLoadState("networkidle");
    
    // 문의가 있거나 빈 메시지가 나타날 때까지 대기
    await Promise.race([
      this.inquiryItems.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.emptyMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.pageTitle.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * 문의 개수 반환
   */
  async getInquiryCount() {
    return await this.inquiryItems.count();
  }

  /**
   * 첫 번째 문의 클릭
   */
  async clickFirstInquiry() {
    const count = await this.getInquiryCount();
    if (count > 0) {
      await this.inquiryItems.first().click();
      await this.page.waitForURL(/\/cs\/inquiries\/\d+/, { timeout: 10000 });
    } else {
      throw new Error("문의가 없습니다");
    }
  }

  /**
   * 문의하기 버튼 클릭
   */
  async clickCreateButton() {
    await this.createButton.waitFor({ state: "visible", timeout: 5000 });
    await this.createButton.click();
    await this.page.waitForURL(/\/cs\/inquiries\/new/, { timeout: 10000 });
  }

  /**
   * 새로고침
   */
  async refresh() {
    if (await this.refreshButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.refreshButton.click();
      await this.waitForInquiriesToLoad();
    } else {
      await this.page.reload();
      await this.waitForInquiriesToLoad();
    }
  }

  /**
   * 문의 목록이 비어있는지 확인
   */
  async expectEmpty() {
    await expect(this.emptyMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * 문의가 표시되는지 확인
   */
  async expectInquiriesVisible() {
    const count = await this.getInquiryCount();
    expect(count).toBeGreaterThan(0);
  }
}

