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
    await this.page.waitForTimeout(2000); // 페이지 렌더링 대기

    // 현재 URL 확인
    const currentUrl = this.page.url();
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    if (currentUrl.includes("/auth") || currentUrl.includes("/login")) {
      console.log("⚠️ 로그인 페이지로 리다이렉트되었습니다.");
      throw new Error("로그인이 필요합니다. 로그인 페이지로 리다이렉트되었습니다.");
    }

    // 폼이 로드될 때까지 대기 (로그인 리다이렉트 가능성 있음)
    try {
      await this.eventNameInput.waitFor({ state: "visible", timeout: 10000 });
      console.log("✅ 티켓 생성 폼이 로드되었습니다.");
    } catch (e) {
      // 폼을 찾지 못한 경우 페이지 상태 확인
      const pageContent = await this.page.content();
      const hasLoginForm = pageContent.includes('로그인') || pageContent.includes('email');
      const hasError = await this.errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasLoginForm) {
        console.log("⚠️ 로그인 폼이 표시되고 있습니다.");
        throw new Error("로그인이 필요합니다. 로그인 폼이 표시되었습니다.");
      } else if (hasError) {
        const errorText = await this.errorMessage.textContent();
        console.log(`⚠️ 에러 메시지: ${errorText}`);
        throw new Error(`페이지 로드 에러: ${errorText}`);
      } else {
        console.log("⚠️ 티켓 생성 폼을 찾을 수 없습니다.");
        throw new Error("티켓 생성 폼을 찾을 수 없습니다.");
      }
    }
  }

  /**
   * 티켓 등록
   */
  async createTicket(ticketData) {
    console.log("📝 티켓 정보 입력 시작...");
    
    // 이벤트명
    await this.eventNameInput.waitFor({ state: "visible", timeout: 5000 });
    await this.eventNameInput.fill(ticketData.eventName);
    await this.page.waitForTimeout(500);

    // 이벤트 날짜
    if (ticketData.eventDate) {
      await this.eventDateInput.waitFor({ state: "visible", timeout: 5000 });
      await this.eventDateInput.fill(ticketData.eventDate);
      await this.page.waitForTimeout(500);
    }

    // 장소
    if (ticketData.eventLocation) {
      await this.eventLocationInput.waitFor({ state: "visible", timeout: 5000 });
      await this.eventLocationInput.fill(ticketData.eventLocation);
      await this.page.waitForTimeout(500);
    }

    // 정가
    if (ticketData.originalPrice) {
      await this.originalPriceInput.waitFor({ state: "visible", timeout: 5000 });
      await this.originalPriceInput.fill(ticketData.originalPrice.toString());
      await this.page.waitForTimeout(500);
    }

    // 카테고리 선택
    if (ticketData.categoryId) {
      // MUI Select: 보이는 div(role=combobox)를 클릭
      const categorySelect = this.page.locator('div[role="combobox"]').filter({ has: this.categorySelect }).first();
      await categorySelect.waitFor({ state: "visible", timeout: 5000 });
      await categorySelect.click();
      await this.page.waitForTimeout(500);
      await this.page.locator(`[data-value="${ticketData.categoryId}"]`).first().click();
      await this.page.waitForTimeout(500);
    }

    // 거래 유형
    if (ticketData.tradeType) {
      // MUI Select: 라벨로 찾아서 클릭
      const tradeTypeField = this.page.getByLabel(/거래.*유형|거래 방식/i);
      await tradeTypeField.waitFor({ state: "visible", timeout: 5000 });
      await tradeTypeField.click();
      await this.page.waitForTimeout(500);

      // 옵션 찾기 - role과 text 둘 다 시도
      const optionLocator = this.page.locator(`li:has-text("${ticketData.tradeType}")`).first();
      await optionLocator.waitFor({ state: "visible", timeout: 5000 });
      await optionLocator.click();
      await this.page.waitForTimeout(500);
    }

    // 판매가
    if (ticketData.sellingPrice) {
      await this.sellingPriceInput.waitFor({ state: "visible", timeout: 5000 });
      await this.sellingPriceInput.fill(ticketData.sellingPrice.toString());
      await this.page.waitForTimeout(500);
    }

    // 좌석 정보
    if (ticketData.seatInfo) {
      await this.seatInfoInput.waitFor({ state: "visible", timeout: 5000 });
      await this.seatInfoInput.fill(ticketData.seatInfo);
      await this.page.waitForTimeout(500);
    }

    // 설명
    if (ticketData.description) {
      await this.descriptionInput.waitFor({ state: "visible", timeout: 5000 });
      await this.descriptionInput.fill(ticketData.description);
      await this.page.waitForTimeout(500);
    }

    // 제출 버튼 확인 및 클릭
    console.log("📤 티켓 등록 제출 중...");
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
    await this.submitButton.click();
    
    // 제출 후 응답 대기
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
    
    // 에러 메시지 확인
    const hasError = await this.errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasError) {
      const errorText = await this.errorMessage.textContent();
      console.log(`⚠️ 티켓 등록 에러: ${errorText}`);
      throw new Error(`티켓 등록 실패: ${errorText}`);
    }
    
    console.log("✅ 티켓 등록 요청 완료");
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
