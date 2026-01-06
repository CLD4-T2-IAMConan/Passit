import { expect } from "@playwright/test";

/**
 * ChatRoomPage - Page Object Model
 *
 * 채팅방 페이지의 요소와 액션을 캡슐화
 */
export class ChatRoomPage {
  constructor(page) {
    this.page = page;

    // 요소 선택자
    this.messageList = page.locator('[data-testid="message-list"], .MuiList-root, [class*="message-list"]');
    this.messages = page.locator('[data-testid="message"], [class*="message-item"], .MuiListItem-root');
    this.messageInput = page.locator('textarea[placeholder*="메시지"], input[placeholder*="메시지"], textarea[name="message"]');
    this.sendButton = page.getByRole("button", { name: /전송|보내기|send/i });
    this.backButton = page.getByRole("button", { name: /뒤로|back/i }).or(page.locator('[aria-label*="back"], [aria-label*="뒤로"]'));
    this.roomHeader = page.locator('[data-testid="chat-room-header"], .MuiAppBar-root, [class*="chat-header"]');
  }

  /**
   * 채팅방 페이지로 이동
   */
  async goto(chatroomId) {
    await this.page.goto(`/chat/${chatroomId}`);
    await this.page.waitForLoadState("networkidle");
    await this.waitForMessagesToLoad();
  }

  /**
   * 메시지가 로드될 때까지 대기
   */
  async waitForMessagesToLoad() {
    await this.page.waitForLoadState("networkidle");
    // 메시지 입력창이 나타날 때까지 대기
    await this.messageInput.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  /**
   * 메시지 전송
   */
  async sendMessage(text) {
    await this.messageInput.waitFor({ state: "visible", timeout: 5000 });
    await this.messageInput.fill(text);
    await this.sendButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 메시지 개수 반환
   */
  async getMessageCount() {
    return await this.messages.count();
  }

  /**
   * 마지막 메시지 텍스트 확인
   */
  async getLastMessageText() {
    const count = await this.getMessageCount();
    if (count > 0) {
      return await this.messages.last().textContent();
    }
    return null;
  }

  /**
   * 특정 텍스트를 포함한 메시지가 있는지 확인
   */
  async expectMessageContaining(text) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10000 });
  }

  /**
   * 뒤로가기
   */
  async goBack() {
    if (await this.backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.backButton.click();
    } else {
      await this.page.goBack();
    }
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 채팅방 헤더가 표시되는지 확인
   */
  async expectHeaderVisible() {
    await expect(this.roomHeader.or(this.page.locator('h1, h2, h3, h4, h5, h6'))).toBeVisible({ timeout: 5000 });
  }
}

