import { expect } from "@playwright/test";

/**
 * TicketCreatePage - Page Object Model
 *
 * 티켓 등록 페이지의 요소와 액션을 캡슐화
 */
export class TicketCreatePage {
  constructor(page) {
    this.page = page;

    // 폼 입력 필드
    this.eventNameInput = page.locator('input[name="eventName"]');
    this.eventDateInput = page.locator('input[name="eventDate"]');
    this.eventLocationInput = page.locator('input[name="eventLocation"]');
    this.originalPriceInput = page.locator('input[name="originalPrice"]');
    this.categorySelect = page.locator('#categoryId, [name="categoryId"]');
    this.tradeTypeSelect = page.locator('#tradeType, [name="tradeType"]');
    this.sellingPriceInput = page.locator('input[name="sellingPrice"]');
    this.seatInfoInput = page.locator('input[name="seatInfo"]');
    this.descriptionInput = page.locator('textarea[name="description"]');

    this.submitButton = page.locator('form').getByRole("button", { name: /등록|제출/i });
    this.successMessage = page.getByText(/티켓이 등록되었습니다|등록 완료|성공/i);
    this.errorMessage = page.getByRole("alert");
  }

  /**
   * 티켓 등록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/sell");
    await this.page.waitForLoadState("networkidle");

    // 폼이 로드될 때까지 대기 (로그인 리다이렉트 가능성 있음)
    try {
      await this.eventNameInput.waitFor({ state: "visible", timeout: 5000 });
    } catch (e) {
      // 로그인 페이지로 리다이렉트되었을 수 있음
      console.log("Ticket create form not found - might be redirected to login");
    }
  }

  /**
   * 티켓 등록
   */
  async createTicket(ticketData) {
    // 이벤트명
    await this.eventNameInput.fill(ticketData.eventName);

    // 이벤트 날짜
    if (ticketData.eventDate) {
      await this.eventDateInput.fill(ticketData.eventDate);
    }

    // 장소
    if (ticketData.eventLocation) {
      await this.eventLocationInput.fill(ticketData.eventLocation);
    }

    // 정가
    if (ticketData.originalPrice) {
      await this.originalPriceInput.fill(ticketData.originalPrice.toString());
    }

    // 카테고리 선택
    if (ticketData.categoryId) {
      // MUI Select: 보이는 div(role=combobox)를 클릭
      await this.page.locator('div[role="combobox"]').filter({ has: this.categorySelect }).click();
      await this.page.waitForTimeout(300);
      await this.page.locator(`[data-value="${ticketData.categoryId}"]`).first().click();
    }

    // 거래 유형
    if (ticketData.tradeType) {
      // MUI Select: 라벨로 찾아서 클릭
      const tradeTypeField = this.page.getByLabel(/거래.*유형|거래 방식/i);
      await tradeTypeField.click();
      await this.page.waitForTimeout(500);

      // 옵션 찾기 - role과 text 둘 다 시도
      const optionLocator = this.page.locator(`li:has-text("${ticketData.tradeType}")`).first();
      await optionLocator.click();
    }

    // 판매가
    if (ticketData.sellingPrice) {
      await this.sellingPriceInput.fill(ticketData.sellingPrice.toString());
    }

    // 좌석 정보
    if (ticketData.seatInfo) {
      await this.seatInfoInput.fill(ticketData.seatInfo);
    }

    // 설명
    if (ticketData.description) {
      await this.descriptionInput.fill(ticketData.description);
    }

    // 제출
    await this.submitButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 성공 메시지 확인
   */
  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * 에러 메시지 확인
   */
  async expectErrorMessage(message) {
    const errorElement = this.page.locator('[role="alert"], .MuiAlert-root').first();
    await expect(errorElement).toBeVisible({ timeout: 10000 });
    if (message) {
      await expect(errorElement).toContainText(message);
    }
  }

  /**
   * 티켓 목록 페이지로 리다이렉트되었는지 확인
   */
  async expectRedirectToTicketList() {
    await this.page.waitForURL(/\/tickets/, { timeout: 10000 });
  }
}
