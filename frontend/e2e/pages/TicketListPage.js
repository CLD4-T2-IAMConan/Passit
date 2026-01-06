import { expect } from "@playwright/test";

/**
 * TicketListPage - Page Object Model
 *
 * 티켓 목록 페이지의 요소와 액션을 캡슐화
 */
export class TicketListPage {
  constructor(page) {
    this.page = page;

    // 검색 관련
    this.searchInput = page.locator('input[placeholder*="검색" i], input[type="search"]');
    this.searchButton = page.getByRole("button", { name: "검색", exact: true });

    // 티켓 카드 - 더 구체적인 셀렉터
    this.ticketCards = page.locator('.MuiCard-root').filter({
      has: page.locator('.MuiCardActionArea-root, .MuiCardContent-root')
    });

    // 뷰 모드 토글
    this.gridViewButton = page.getByLabel(/그리드.*보기|grid/i);
    this.listViewButton = page.getByLabel(/리스트.*보기|list/i);

    // 페이지네이션
    this.pagination = page.locator('.MuiPagination-root');
    this.nextPageButton = page.getByLabel(/다음.*페이지|next page/i);
    this.prevPageButton = page.getByLabel(/이전.*페이지|previous page/i);

    // 정렬
    this.sortSelect = page.locator('select, [role="combobox"]').filter({ hasText: /정렬|sort/i });

    // 로딩 및 에러
    this.loadingSpinner = page.locator('.MuiCircularProgress-root');
    this.errorMessage = page.getByRole("alert");
    this.emptyMessage = page.getByText(/티켓이 없습니다|검색 결과가 없습니다/i);
  }

  /**
   * 티켓 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/tickets");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 특정 키워드로 검색
   */
  async search(keyword) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 첫 번째 티켓 카드 클릭
   */
  async clickFirstTicket() {
    const firstCard = this.ticketCards.first();
    await firstCard.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 특정 인덱스의 티켓 카드 클릭
   */
  async clickTicketByIndex(index) {
    const card = this.ticketCards.nth(index);
    await card.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 티켓 카드 개수 확인
   */
  async getTicketCount() {
    return await this.ticketCards.count();
  }

  /**
   * 다음 페이지로 이동
   */
  async goToNextPage() {
    await this.nextPageButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 로딩 완료 대기
   */
  async waitForTicketsToLoad() {
    // 로딩 스피너가 사라질 때까지 대기
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * 티켓 목록이 표시되는지 확인
   */
  async expectTicketsVisible() {
    await this.waitForTicketsToLoad();
    const count = await this.getTicketCount();
    expect(count).toBeGreaterThan(0);
  }
}
