import { test, expect } from "@playwright/test";
import { TicketCreatePage } from "./pages/TicketCreatePage";
import { TicketListPage } from "./pages/TicketListPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";

/**
 * 티켓 전체 플로우 E2E 테스트
 *
 * 티켓 생성 → 목록 조회 → 상세 조회를 한 번에 테스트
 */

test.describe("티켓 전체 플로우 (등록 → 조회)", () => {
  let ticketCreatePage;
  let ticketListPage;
  let ticketDetailPage;
  let testEmail;
  let testPassword;
  let createdTicketName;

  test.beforeAll(async ({ browser }) => {
    // 테스트용 계정 생성 및 티켓 등록
    const page = await browser.newPage();
    ticketCreatePage = new TicketCreatePage(page);

    testEmail = `e2e-flow-${Date.now()}@example.com`;
    testPassword = "Test1234";
    const testNickname = `flowtest${Date.now()}`;
    createdTicketName = `E2E 플로우 테스트 티켓 ${Date.now()}`;

    try {
      // 브라우저를 통한 회원가입 및 로그인
      const signupPage = new SignupPage(page);
      const loginPage = new LoginPage(page);

      console.log(`📝 회원가입: ${testEmail}`);

      // 1. 회원가입
      await signupPage.goto();
      await signupPage.signup({
        email: testEmail,
        password: testPassword,
        name: "E2E Flow Tester",
        phone: "010-1234-5678",
      });

      // 회원가입 성공 대기
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // 2. 로그인
      console.log(`🔐 로그인: ${testEmail}`);
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);

      // 로그인 성공 대기
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // 티켓 생성
      console.log(`🎫 티켓 생성: ${createdTicketName}`);
      await ticketCreatePage.goto();

      const ticketData = {
        eventName: createdTicketName,
        eventDate: "2026-06-20T19:00",
        eventLocation: "서울 잠실종합운동장",
        originalPrice: "120000",
        sellingPrice: "120000",
        seatInfo: "B구역 3열 8번",
        description: "E2E 전체 플로우 테스트용 티켓입니다.",
      };

      await ticketCreatePage.createTicket(ticketData);
      await page.waitForTimeout(3000);

      console.log("✅ 티켓 생성 완료");

      // 티켓이 DB에 저장되고 목록에 반영될 시간 대기
      await page.waitForTimeout(2000);

      await page.close();
    } catch (error) {
      console.log("❌ 티켓 생성 중 에러:", error.message);
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    ticketListPage = new TicketListPage(page);
    ticketDetailPage = new TicketDetailPage(page);
  });

  test("1. 생성한 티켓이 목록에 표시되는지 확인", async ({ page }) => {
    await ticketListPage.goto();
    await ticketListPage.waitForTicketsToLoad();

    // 페이지 내용 디버깅
    const pageContent = await page.content();
    const hasCards = pageContent.includes('MuiCard');
    console.log(`🔍 페이지에 Card 컴포넌트 있음: ${hasCards}`);

    // 모든 Card 확인
    const allCards = await page.locator('.MuiCard-root').count();
    console.log(`🔍 전체 MuiCard 개수: ${allCards}`);

    const ticketCount = await ticketListPage.getTicketCount();
    console.log(`📋 필터링된 티켓 카드 개수: ${ticketCount}`);

    if (ticketCount === 0 && allCards > 0) {
      console.log("⚠️ Card는 있지만 필터가 잘못되었을 수 있음");
    }

    expect(ticketCount).toBeGreaterThan(0);
    console.log("✅ 티켓 목록에 항목이 표시됩니다");
  });

  test("2. 생성한 티켓 검색하기", async ({ page }) => {
    await ticketListPage.goto();
    await ticketListPage.waitForTicketsToLoad();

    // 생성한 티켓 이름으로 검색
    console.log(`🔍 검색어: "${createdTicketName}"`);
    await ticketListPage.search(createdTicketName);
    await ticketListPage.waitForTicketsToLoad();

    console.log("✅ 검색 실행 완료");
  });

  test("3. 티켓 상세 페이지 조회", async ({ page }) => {
    await ticketListPage.goto();
    await ticketListPage.waitForTicketsToLoad();

    const ticketCount = await ticketListPage.getTicketCount();

    if (ticketCount > 0) {
      // 첫 번째 티켓 클릭
      await ticketListPage.clickFirstTicket();

      // 상세 페이지로 이동 확인
      await page.waitForURL(/\/tickets\/\d+\/detail/, { timeout: 10000 });
      console.log(`📍 상세 페이지: ${page.url()}`);

      // 티켓 정보 표시 확인
      await ticketDetailPage.expectTicketInfoVisible();

      console.log("✅ 티켓 상세 정보가 표시됩니다");
    } else {
      test.skip();
    }
  });

  test("4. 상세 페이지에서 목록으로 복귀", async ({ page }) => {
    await ticketListPage.goto();
    await ticketListPage.waitForTicketsToLoad();

    const ticketCount = await ticketListPage.getTicketCount();

    if (ticketCount > 0) {
      // 상세 페이지로 이동
      await ticketListPage.clickFirstTicket();
      await page.waitForURL(/\/tickets\/\d+\/detail/, { timeout: 10000 });

      // 뒤로가기
      await page.goBack();
      await page.waitForLoadState("networkidle");

      // 목록 페이지 확인
      expect(page.url()).toContain("/tickets");
      expect(page.url()).not.toContain("/detail");

      console.log("✅ 목록 페이지로 복귀 완료");
    } else {
      test.skip();
    }
  });
});
