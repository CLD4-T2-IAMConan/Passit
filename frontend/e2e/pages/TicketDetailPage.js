import { expect } from "@playwright/test";

/**
 * TicketDetailPage - Page Object Model
 *
 * 티켓 상세 페이지의 요소와 액션을 캡슐화
 */
export class TicketDetailPage {
  constructor(page) {
    this.page = page;

    // 티켓 정보
    this.eventName = page.locator('h1, h2, h3').filter({ hasText: /이벤트|콘서트|공연/i }).first();
    this.eventDate = page.getByText(/날짜|일시/i);
    this.eventLocation = page.getByText(/장소|위치/i);
    this.price = page.getByText(/가격|원/i);
    this.seatInfo = page.getByText(/좌석/i);
    this.description = page.locator('[data-testid="ticket-description"], .description');

    // 액션 버튼
    this.buyButton = page.getByRole("button", { name: /구매|거래.*신청/i });
    this.backButton = page.getByRole("button", { name: /목록|뒤로/i });
    this.editButton = page.getByRole("button", { name: /수정/i });
    this.deleteButton = page.getByRole("button", { name: /삭제/i });

    // 상태 정보
    this.statusBadge = page.locator('.MuiChip-root, .badge').filter({ hasText: /판매|거래|예약/i });
  }

  /**
   * 특정 티켓 상세 페이지로 이동
   */
  async goto(ticketId) {
    await this.page.goto(`/tickets/${ticketId}/detail`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 뒤로 가기 (목록으로)
   */
  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 구매/거래 신청 버튼 클릭
   */
  async clickBuy() {
    await this.buyButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 티켓 정보 확인
   */
  async expectTicketInfoVisible() {
    // 최소한 이벤트명과 가격이 보여야 함
    await expect(this.eventName.or(this.page.locator('h1')).first()).toBeVisible({ timeout: 10000 });
    await expect(this.price.or(this.page.locator('text=/\\d+.*원/')).first()).toBeVisible({ timeout: 10000 });
  }
}
