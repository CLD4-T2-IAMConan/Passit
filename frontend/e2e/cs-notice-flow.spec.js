import { test, expect } from "@playwright/test";
import { NoticeListPage } from "./pages/NoticeListPage";
import { NoticePage } from "./pages/NoticePage";

/**
 * 공지사항 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * - 공지사항 목록 조회
 * - 공지사항 상세 조회
 * - 공지사항 목록으로 복귀
 */

test.describe("공지사항 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 공지사항은 로그인 없이도 조회 가능
    // 필요시 로그인 로직 추가
  });

  test("1. 공지사항 목록 조회", async ({ page }) => {
    const noticeListPage = new NoticeListPage(page);
    await noticeListPage.goto();
    await noticeListPage.waitForNoticesToLoad();

    const count = await noticeListPage.getNoticeCount();
    console.log(`📋 공지사항 개수: ${count}`);

    if (count > 0) {
      await noticeListPage.expectNoticesVisible();
      console.log("✅ 공지사항 목록이 표시됩니다");
    } else {
      await noticeListPage.expectEmpty();
      console.log("ℹ️ 공지사항이 없습니다 (정상)");
    }
  });

  test("2. 공지사항 상세 조회", async ({ page }) => {
    const noticeListPage = new NoticeListPage(page);
    await noticeListPage.goto();
    await noticeListPage.waitForNoticesToLoad();

    const count = await noticeListPage.getNoticeCount();
    if (count > 0) {
      // 첫 번째 공지사항 클릭
      await noticeListPage.clickFirstNotice();

      // 상세 페이지로 이동 확인
      await page.waitForURL(/\/cs\/notices\/\d+/, { timeout: 10000 });
      console.log(`📍 상세 페이지: ${page.url()}`);

      // 공지사항 정보 표시 확인
      const noticePage = new NoticePage(page);
      await noticePage.expectNoticeInfoVisible();

      console.log("✅ 공지사항 상세 정보가 표시됩니다");
    } else {
      test.skip();
    }
  });

  test("3. 공지사항 상세에서 목록으로 복귀", async ({ page }) => {
    const noticeListPage = new NoticeListPage(page);
    await noticeListPage.goto();
    await noticeListPage.waitForNoticesToLoad();

    const count = await noticeListPage.getNoticeCount();
    if (count > 0) {
      // 상세 페이지로 이동
      await noticeListPage.clickFirstNotice();
      await page.waitForURL(/\/cs\/notices\/\d+/, { timeout: 10000 });

      // 뒤로가기
      const noticePage = new NoticePage(page);
      await noticePage.goBack();
      await page.waitForLoadState("networkidle");

      // 목록 페이지 확인
      expect(page.url()).toContain("/cs/notices");
      expect(page.url()).not.toMatch(/\/cs\/notices\/\d+/);

      console.log("✅ 목록 페이지로 복귀 완료");
    } else {
      test.skip();
    }
  });
});

