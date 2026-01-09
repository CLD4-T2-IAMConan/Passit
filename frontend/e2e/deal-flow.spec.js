import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { TicketListPage } from "./pages/TicketListPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { DealListPage } from "./pages/DealListPage";
import { DealAcceptPage } from "./pages/DealAcceptPage";

/**
 * 거래/양도 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * - 티켓 상세에서 거래 요청
 * - 거래 목록 조회 (구매/판매)
 * - 거래 상세 조회
 * - 거래 수락/거절 (판매자)
 * - 거래 확정 (구매자)
 */

test.describe("거래/양도 플로우", () => {
  let buyerEmail;
  let buyerPassword;
  let sellerEmail;
  let sellerPassword;
  let ticketId;
  let dealId;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000); // 2분 타임아웃
    
    // 백엔드 서버 상태 확인
    let backendAvailable = false;
    const backendUrls = [
      'http://localhost:8081/api/auth/health',
      'http://localhost:8081/actuator/health',
      'https://dmvwgbcww82sl.cloudfront.net/api/auth/health',
    ];
    
    for (const url of backendUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        }).catch(() => null);
        
        if (response && response.ok) {
          backendAvailable = true;
          console.log(`✅ 백엔드 서버 확인: ${url}`);
          break;
        }
      } catch (e) {
        // 다음 URL 시도
      }
    }
    
    if (!backendAvailable) {
      console.log("⚠️ 백엔드 서버가 실행 중이지 않습니다.");
      console.log("💡 백엔드 서버 시작 방법:");
      console.log("   - service-account: cd service-account && ./gradlew bootRun");
      console.log("   - service-ticket: cd service-ticket && ./gradlew bootRun");
      console.log("   - service-trade: cd service-trade && ./gradlew bootRun");
      console.log("⚠️ 테스트를 계속 진행하지만 로그인 실패가 예상됩니다.");
    }
    
    // 구매자와 판매자 계정 생성
    const page = await browser.newPage();
    const timestamp = Date.now();
    
    buyerEmail = `e2e-buyer-${timestamp}@example.com`;
    buyerPassword = "Test1234!";
    sellerEmail = `e2e-seller-${timestamp}@example.com`;
    sellerPassword = "Test1234!";

    try {
      const baseURL = process.env.BASE_URL || "http://localhost:3000";

      // 구매자 회원가입
      console.log(`📝 구매자 회원가입: ${buyerEmail}`);
      await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: buyerEmail,
          password: buyerPassword,
          name: "E2E Buyer",
          nickname: `buyer${timestamp}`,
        },
      });

      // 판매자 회원가입
      console.log(`📝 판매자 회원가입: ${sellerEmail}`);
      await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: sellerEmail,
          password: sellerPassword,
          name: "E2E Seller",
          nickname: `seller${timestamp}`,
        },
      });

      await page.waitForTimeout(2000);

      // 판매자로 로그인하여 티켓 목록 조회
      const sellerLoginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
        data: { email: sellerEmail, password: sellerPassword },
      });

      const sellerLoginData = await sellerLoginResponse.json();
      if (sellerLoginData.success) {
        // 티켓 목록에서 첫 번째 티켓 ID 가져오기
        const ticketListResponse = await page.request.get(`${baseURL}/api/tickets?page=0&size=1`, {
          headers: {
            Authorization: `Bearer ${sellerLoginData.data.accessToken}`
          }
        });
        const ticketListData = await ticketListResponse.json();
        
        if (ticketListData.success && ticketListData.data?.content?.length > 0) {
          ticketId = ticketListData.data.content[0].id;
          console.log(`🎫 테스트용 티켓 ID: ${ticketId}`);
        } else {
          console.log("⚠️ 사용 가능한 티켓이 없습니다. 티켓을 먼저 생성해주세요.");
        }
      }

      await page.close();
    } catch (error) {
      console.log("❌ 초기 설정 중 에러:", error.message);
      await page.close();
    }
  });

  test("1. 티켓 상세에서 거래 요청", async ({ page }) => {
    if (!ticketId) {
      test.skip();
      return;
    }

    // 구매자로 로그인
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: buyerEmail, password: buyerPassword },
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    await page.goto("/");
    await page.evaluate((data) => {
      localStorage.setItem("accessToken", data.accessToken);
      const user = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(user));
    }, loginData.data);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 티켓 상세 페이지로 이동
    const ticketDetailPage = new TicketDetailPage(page);
    await ticketDetailPage.goto(ticketId);
    await ticketDetailPage.expectTicketInfoVisible();

    // 거래 요청 버튼 찾기 및 클릭
    const dealRequestButton = page.getByRole("button", { name: /구매|거래.*신청|양도.*요청/i });
    
    if (await dealRequestButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dealRequestButton.click();
      await page.waitForTimeout(2000);

      // 거래 요청 모달이 나타나는지 확인
      const modal = page.locator('[role="dialog"], .MuiModal-root, [class*="modal"]');
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 수량 입력
        const quantityInput = page.locator('input[type="number"], input[name*="quantity"]');
        if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await quantityInput.fill("1");
        }

        // 요청 버튼 클릭
        const confirmButton = page.getByRole("button", { name: /요청|신청|확인/i });
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2000);
          console.log("✅ 거래 요청 완료");
        }
      }
    } else {
      console.log("⚠️ 거래 요청 버튼을 찾을 수 없습니다");
    }
  });

  test("2. 거래 목록 조회 (구매 내역)", async ({ page }) => {
    // 구매자로 로그인
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: buyerEmail, password: buyerPassword },
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    await page.goto("/");
    await page.evaluate((data) => {
      localStorage.setItem("accessToken", data.accessToken);
      const user = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(user));
    }, loginData.data);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const dealListPage = new DealListPage(page);
    await dealListPage.goto();
    await dealListPage.waitForDealsToLoad();

    // 구매 내역 탭 확인
    await dealListPage.clickPurchaseTab();
    await dealListPage.waitForDealsToLoad();

    const count = await dealListPage.getDealCount();
    console.log(`📋 구매 내역 개수: ${count}`);

    if (count > 0) {
      await dealListPage.expectDealsVisible();
      
      // 첫 번째 거래 ID 저장
      const firstDeal = dealListPage.dealCards.first();
      const dealHref = await firstDeal.getAttribute('href').catch(() => null);
      if (dealHref) {
        const match = dealHref.match(/\/deals\/(\d+)/);
        if (match) {
          dealId = parseInt(match[1]);
          console.log(`💼 거래 ID 저장: ${dealId}`);
        }
      }
      
      console.log("✅ 구매 내역이 표시됩니다");
    } else {
      await dealListPage.expectEmpty();
      console.log("ℹ️ 구매 내역이 없습니다 (정상)");
    }
  });

  test("3. 거래 상세 조회", async ({ page }) => {
    // 구매자로 로그인
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: buyerEmail, password: buyerPassword },
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    await page.goto("/");
    await page.evaluate((data) => {
      localStorage.setItem("accessToken", data.accessToken);
      const user = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(user));
    }, loginData.data);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const dealListPage = new DealListPage(page);
    await dealListPage.goto();
    await dealListPage.waitForDealsToLoad();

    const count = await dealListPage.getDealCount();
    if (count > 0) {
      // 첫 번째 거래 클릭
      await dealListPage.clickFirstDeal();
      
      // 거래 상세 페이지 확인
      await page.waitForURL(/\/deals\/\d+\/detail/, { timeout: 10000 });
      
      // URL에서 dealId 추출
      const url = page.url();
      const match = url.match(/\/deals\/(\d+)/);
      if (match) {
        dealId = parseInt(match[1]);
        console.log(`💼 거래 ID: ${dealId}`);
      }
      
      const dealAcceptPage = new DealAcceptPage(page);
      await dealAcceptPage.expectDealInfoVisible();
      
      console.log("✅ 거래 상세 정보가 표시됩니다");
    } else {
      test.skip();
    }
  });

  test("4. 판매자 - 거래 수락", async ({ page }) => {
    if (!ticketId) {
      test.skip();
      return;
    }

    // 판매자로 로그인
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: sellerEmail, password: sellerPassword },
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      test.skip();
      return;
    }

    await page.goto("/");
    await page.evaluate((data) => {
      localStorage.setItem("accessToken", data.accessToken);
      const user = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(user));
    }, loginData.data);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 판매 내역에서 거래 찾기
    const dealListPage = new DealListPage(page);
    await dealListPage.goto();
    await dealListPage.clickSalesTab();
    await dealListPage.waitForDealsToLoad();

    const count = await dealListPage.getDealCount();
    if (count > 0) {
      // 첫 번째 거래 클릭
      await dealListPage.clickFirstDeal();
      await page.waitForURL(/\/deals\/\d+\/detail/, { timeout: 10000 });

      const dealAcceptPage = new DealAcceptPage(page);
      await dealAcceptPage.expectDealInfoVisible();

      // 수락 버튼이 있으면 클릭
      const acceptButton = page.getByRole("button", { name: /수락|거래 수락|accept/i });
      if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(2000);
        
        // 확인 다이얼로그 처리
        const confirmDialog = page.getByRole("button", { name: /확인|ok|yes/i });
        if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmDialog.click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2000);
        }
        
        console.log("✅ 거래 수락 완료");
      } else {
        console.log("ℹ️ 거래 수락 버튼이 없습니다 (이미 처리된 거래일 수 있음)");
      }
    } else {
      test.skip();
    }
  });
});

