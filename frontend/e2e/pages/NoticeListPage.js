import { expect } from "@playwright/test";

/**
 * NoticeListPage - Page Object Model
 *
 * 공지사항 목록 페이지의 요소와 액션을 캡슐화
 */
export class NoticeListPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.noticeList = page.locator('ul, [class*="notice-list"], .MuiList-root');
    this.noticeItems = page.locator('li, [class*="notice-item"], .MuiListItem-root');
    this.noticeButtons = page.locator('button, [role="button"]').filter({ hasText: /공지|제목/i });
    this.emptyMessage = page.getByText(/공지 없음|공지사항이 없습니다/i);
    this.pageTitle = page.getByRole("heading", { name: /공지사항|공지/i });
  }

  /**
   * 공지사항 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/cs/notices");
    await this.page.waitForLoadState("networkidle");
    await this.waitForNoticesToLoad();
  }

  /**
   * 공지사항 목록이 로드될 때까지 대기
   */
  async waitForNoticesToLoad() {
    await this.page.waitForLoadState("networkidle");
    
    // 공지사항이 있거나 빈 메시지가 나타날 때까지 대기
    await Promise.race([
      this.noticeItems.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.emptyMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.pageTitle.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * 공지사항 개수 반환
   */
  async getNoticeCount() {
    return await this.noticeItems.count();
  }

  /**
   * 첫 번째 공지사항 클릭
   */
  async clickFirstNotice() {
    const count = await this.getNoticeCount();
    if (count > 0) {
      // 버튼이 있으면 버튼 클릭, 없으면 리스트 아이템 클릭
      const button = this.noticeButtons.first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await button.click();
      } else {
        await this.noticeItems.first().click();
      }
      await this.page.waitForURL(/\/cs\/notices\/\d+/, { timeout: 10000 });
    } else {
      throw new Error("공지사항이 없습니다");
    }
  }

  /**
   * 공지사항 목록이 비어있는지 확인
   */
  async expectEmpty() {
    await expect(this.emptyMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * 공지사항이 표시되는지 확인
   */
  async expectNoticesVisible() {
    const count = await this.getNoticeCount();
    expect(count).toBeGreaterThan(0);
  }
}

