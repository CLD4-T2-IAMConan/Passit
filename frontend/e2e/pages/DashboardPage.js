import { expect } from "@playwright/test";

/**
 * DashboardPage - Page Object Model
 *
 * 대시보드 페이지의 요소와 액션을 캡슐화
 */
export class DashboardPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.welcomeMessage = page.getByRole("heading", { name: /welcome|환영/i });
    this.logoutButton = page.getByRole("button", { name: /logout|로그아웃/i });
    this.profileLink = page.getByRole("link", { name: /profile|프로필|마이페이지/i });
    this.settingsLink = page.getByRole("link", { name: /settings|설정/i });
    this.userMenu = page.getByRole("button", { name: /user menu|사용자 메뉴/i });
  }

  /**
   * 대시보드 페이지로 이동 (홈페이지)
   */
  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 로그아웃 수행
   */
  async logout() {
    // 사용자 메뉴 열기
    await this.userMenu.click();

    // 로그아웃 버튼 클릭
    await this.logoutButton.click();
  }

  /**
   * 프로필 페이지로 이동
   */
  async goToProfile() {
    await this.profileLink.click();
  }

  /**
   * 설정 페이지로 이동
   */
  async goToSettings() {
    await this.settingsLink.click();
  }

  /**
   * 환영 메시지에 사용자 이름이 포함되어 있는지 확인
   */
  async expectWelcomeMessage(userName) {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.welcomeMessage).toContainText(userName);
  }
}
