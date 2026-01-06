import { expect } from "@playwright/test";

/**
 * ChatListPage - Page Object Model
 *
 * 채팅 목록 페이지의 요소와 액션을 캡슐화
 */
export class ChatListPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.chatRoomList = page.locator('[data-testid="chat-room-list"], .MuiList-root, [class*="chat-room"]');
    this.chatRoomItems = page.locator('[data-testid="chat-room-item"], .MuiListItem-root, [class*="chat-room-item"]');
    this.emptyMessage = page.getByText(/채팅방이 없습니다|채팅 목록이 비어있습니다/i);
    this.newChatButton = page.getByRole("button", { name: /새 채팅|채팅 시작/i });
  }

  /**
   * 채팅 목록 페이지로 이동
   */
  async goto() {
    await this.page.goto("/chat");
    await this.page.waitForLoadState("networkidle");
    
    // 채팅 목록이 로드될 때까지 대기
    await this.waitForChatRoomsToLoad();
  }

  /**
   * 채팅방 목록이 로드될 때까지 대기
   */
  async waitForChatRoomsToLoad() {
    await this.page.waitForLoadState("networkidle");
    
    // 채팅방이 있거나 빈 메시지가 나타날 때까지 대기
    await Promise.race([
      this.chatRoomItems.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      this.emptyMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * 채팅방 개수 반환
   */
  async getChatRoomCount() {
    return await this.chatRoomItems.count();
  }

  /**
   * 첫 번째 채팅방 클릭
   */
  async clickFirstChatRoom() {
    const count = await this.getChatRoomCount();
    if (count > 0) {
      await this.chatRoomItems.first().click();
      await this.page.waitForURL(/\/chat\/\d+/, { timeout: 10000 });
    } else {
      throw new Error("채팅방이 없습니다");
    }
  }

  /**
   * 특정 채팅방 클릭 (인덱스)
   */
  async clickChatRoomByIndex(index) {
    const count = await this.getChatRoomCount();
    if (count > index) {
      await this.chatRoomItems.nth(index).click();
      await this.page.waitForURL(/\/chat\/\d+/, { timeout: 10000 });
    } else {
      throw new Error(`인덱스 ${index}의 채팅방이 없습니다`);
    }
  }

  /**
   * 채팅방 목록이 비어있는지 확인
   */
  async expectEmpty() {
    await expect(this.emptyMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * 채팅방이 표시되는지 확인
   */
  async expectChatRoomsVisible() {
    const count = await this.getChatRoomCount();
    expect(count).toBeGreaterThan(0);
  }
}

