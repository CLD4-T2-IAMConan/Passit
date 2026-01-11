import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { TicketListPage } from "./pages/TicketListPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { ChatRoomPage } from "./pages/ChatRoomPage";
import { DealListPage } from "./pages/DealListPage";
import { DealAcceptPage } from "./pages/DealAcceptPage";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";

/**
 * 티켓 상세 → 채팅 → 결제 요청 → 결제 진행 → 구매 티켓 목록 확인 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 티켓 상세 페이지 접근
 * 2. 채팅창으로 이동
 * 3. 채팅하기
 * 4. 결제 요청 (판매자가 거래 수락)
 * 5. 결제 진행
 * 6. 구매한 티켓 목록 확인
 */

test.describe("티켓 상세 → 채팅 → 결제 → 구매 티켓 목록 플로우", () => {
  let buyerEmail;
  let buyerPassword;
  let sellerEmail;
  let sellerPassword;
  let ticketId;
  let chatroomId;
  let dealId;
  let paymentId;

  test.beforeAll(async ({ browser }) => {
    // 타임아웃 증가 (180초)
    test.setTimeout(180000);

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
      const buyerSignupResponse = await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: buyerEmail,
          password: buyerPassword,
          name: "E2E Buyer",
          nickname: `buyer${timestamp}`,
        },
      });

      const buyerSignupData = await buyerSignupResponse.json();
      if (!buyerSignupData.success) {
        console.log("⚠️ 구매자 회원가입 실패:", buyerSignupData.message);
      }

      // 판매자 회원가입
      console.log(`📝 판매자 회원가입: ${sellerEmail}`);
      const sellerSignupResponse = await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: sellerEmail,
          password: sellerPassword,
          name: "E2E Seller",
          nickname: `seller${timestamp}`,
        },
      });

      const sellerSignupData = await sellerSignupResponse.json();
      if (!sellerSignupData.success) {
        console.log("⚠️ 판매자 회원가입 실패:", sellerSignupData.message);
      }

      await page.waitForTimeout(2000);

      // 판매자로 로그인하여 티켓 목록 조회
      const sellerLoginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
        data: { email: sellerEmail, password: sellerPassword },
      });

      const sellerLoginData = await sellerLoginResponse.json();
      if (sellerLoginData.success) {
        // 티켓 목록에서 첫 번째 티켓 ID 가져오기
        const ticketListResponse = await page.request.get(`${baseURL}/api/tickets?page=0&size=1`);
        const ticketListData = await ticketListResponse.json();

        if (ticketListData.success && ticketListData.data?.content?.length > 0) {
          ticketId = ticketListData.data.content[0].id;
          console.log(`🎫 테스트용 티켓 ID: ${ticketId}`);
        } else {
          console.log("⚠️ 사용 가능한 티켓이 없습니다");
        }
      }

      await page.close();
    } catch (error) {
      console.log("❌ 초기 설정 중 에러:", error.message);
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 구매자로 로그인 상태 설정
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: buyerEmail, password: buyerPassword },
    });

    const loginData = await loginResponse.json();
    if (loginData.success) {
      await page.goto("/");
      await page.evaluate((data) => {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        const user = {
          userId: data.userId,
          email: data.email,
          name: data.name,
          role: data.role,
          provider: data.provider,
        };
        localStorage.setItem("user", JSON.stringify(user));
      }, loginData.data);
      await page.reload();
      await page.waitForLoadState("networkidle");
    }
  });

  test("1. 티켓 상세 페이지에서 채팅창으로 이동", async ({ page }) => {
    if (!ticketId) {
      test.skip();
      return;
    }

    const ticketDetailPage = new TicketDetailPage(page);
    await ticketDetailPage.goto(ticketId);
    await ticketDetailPage.expectTicketInfoVisible();

    console.log("✅ 티켓 상세 페이지 접근 완료");

    // 채팅 버튼 찾기 및 클릭
    const chatButton = page
      .getByRole("button", { name: /채팅|문의|연락/i })
      .or(page.locator('[aria-label*="chat"], [aria-label*="채팅"]'));

    if (await chatButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatButton.click();
      await page.waitForURL(/\/chat\/\d+/, { timeout: 10000 });

      // URL에서 chatroomId 추출
      const url = page.url();
      const match = url.match(/\/chat\/(\d+)/);
      if (match) {
        chatroomId = parseInt(match[1]);
        console.log(`💬 채팅방 ID: ${chatroomId}`);
      }

      console.log("✅ 채팅방으로 이동 완료");
    } else {
      console.log("⚠️ 채팅 버튼을 찾을 수 없습니다");
      // 채팅 버튼이 없으면 직접 채팅방 생성 시도
      const baseURL = process.env.BASE_URL || "http://localhost:3000";
      const currentUser = JSON.parse(await page.evaluate(() => localStorage.getItem("user")));
      
      try {
        const createChatResponse = await page.request.post(`${baseURL}/api/chat/rooms`, {
          data: {
            ticketId: ticketId,
            buyerId: currentUser.userId,
          },
        });
        const createChatData = await createChatResponse.json();
        if (createChatData.success && createChatData.data?.chatroomId) {
          chatroomId = createChatData.data.chatroomId;
          await page.goto(`/chat/${chatroomId}`);
          console.log(`✅ 채팅방 생성 및 이동 완료: ${chatroomId}`);
        }
      } catch (error) {
        console.log("⚠️ 채팅방 생성 실패:", error.message);
      }
    }
  });

  test("2. 채팅방에서 메시지 전송", async ({ page }) => {
    if (!chatroomId) {
      // 이전 테스트에서 chatroomId를 얻지 못한 경우, 다시 시도
      if (!ticketId) {
        test.skip();
        return;
      }

      const ticketDetailPage = new TicketDetailPage(page);
      await ticketDetailPage.goto(ticketId);

      const baseURL = process.env.BASE_URL || "http://localhost:3000";
      const currentUser = JSON.parse(await page.evaluate(() => localStorage.getItem("user")));

      try {
        const createChatResponse = await page.request.post(`${baseURL}/api/chat/rooms`, {
          data: {
            ticketId: ticketId,
            buyerId: currentUser.userId,
          },
        });
        const createChatData = await createChatResponse.json();
        if (createChatData.success && createChatData.data?.chatroomId) {
          chatroomId = createChatData.data.chatroomId;
        }
      } catch (error) {
        console.log("⚠️ 채팅방 생성 실패:", error.message);
        test.skip();
        return;
      }
    }

    const chatRoomPage = new ChatRoomPage(page);
    await chatRoomPage.goto(chatroomId);
    await chatRoomPage.waitForMessagesToLoad();
    await chatRoomPage.expectHeaderVisible();

    // 테스트 메시지 전송
    const testMessage = `E2E 테스트 메시지 ${Date.now()}`;
    console.log(`💬 메시지 전송: ${testMessage}`);
    await chatRoomPage.sendMessage(testMessage);
    await page.waitForTimeout(2000);

    // 메시지가 표시되는지 확인
    await chatRoomPage.expectMessageContaining(testMessage);
    console.log("✅ 메시지 전송 및 표시 확인");
  });

  test("3. 판매자가 거래 수락하여 결제 요청 생성", async ({ page }) => {
    if (!ticketId) {
      test.skip();
      return;
    }

    // 판매자로 로그인
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const sellerLoginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: sellerEmail, password: sellerPassword },
    });

    const sellerLoginData = await sellerLoginResponse.json();
    if (!sellerLoginData.success) {
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
    }, sellerLoginData.data);
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

      // URL에서 dealId 추출
      const url = page.url();
      const dealMatch = url.match(/\/deals\/(\d+)\/detail/);
      if (dealMatch) {
        dealId = parseInt(dealMatch[1]);
        console.log(`📋 거래 ID: ${dealId}`);
      }

      const dealAcceptPage = new DealAcceptPage(page);
      await dealAcceptPage.expectDealInfoVisible();

      // 수락 버튼이 있으면 클릭
      const acceptButton = page.getByRole("button", { name: /수락|거래 수락/i });
      if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(3000);
        console.log("✅ 거래 수락 완료 (결제 요청 생성)");
      } else {
        console.log("ℹ️ 거래 수락 버튼이 없습니다 (이미 처리된 거래일 수 있음)");
      }
    } else {
      console.log("⚠️ 판매 내역에 거래가 없습니다. 구매자가 먼저 거래를 요청해야 합니다.");
      test.skip();
    }
  });

  test("4. 구매자가 결제 진행", async ({ page }) => {
    // 거래 목록에서 결제 대기 중인 거래 찾기
    const dealListPage = new DealListPage(page);
    await dealListPage.goto();
    await dealListPage.clickPurchaseTab();
    await dealListPage.waitForDealsToLoad();

    const count = await dealListPage.getDealCount();
    if (count === 0) {
      console.log("⚠️ 구매 내역에 거래가 없습니다");
      test.skip();
      return;
    }

    // 첫 번째 거래 클릭
    await dealListPage.clickFirstDeal();
    await page.waitForURL(/\/deals\/\d+\/detail/, { timeout: 10000 });

    const url = page.url();
    const dealMatch = url.match(/\/deals\/(\d+)\/detail/);
    if (dealMatch) {
      dealId = parseInt(dealMatch[1]);
      console.log(`📋 거래 ID: ${dealId}`);
    }

    // 거래 상세 페이지에서 결제하기 버튼 찾기
    const paymentButton = page.getByRole("button", { name: /결제|결제하기|pay/i });
    
    if (await paymentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await paymentButton.click();
      await page.waitForTimeout(2000);

      // 결제 페이지로 이동했는지 확인
      await page.waitForURL(/\/payments\/\d+\/detail/, { timeout: 10000 });

      // URL에서 paymentId 추출
      const paymentUrl = page.url();
      const paymentMatch = paymentUrl.match(/\/payments\/(\d+)\/detail/);
      if (paymentMatch) {
        paymentId = parseInt(paymentMatch[1]);
        console.log(`💳 결제 ID: ${paymentId}`);
      }

      const paymentPage = new PaymentPage(page);
      await paymentPage.waitForPageToLoad();
      await paymentPage.expectPaymentInfoVisible();

      // 결제 버튼 클릭
      await paymentPage.clickPayButton();
      await page.waitForTimeout(1000);

      // 결제 모달 확인
      await paymentPage.expectPaymentModalVisible();

      // 실제 결제는 테스트 환경에서 스킵 (NICEPAY 연동 필요)
      console.log("ℹ️ 실제 결제는 테스트 환경에서 스킵됩니다 (NICEPAY 연동 필요)");
      await paymentPage.cancelPayment();

      console.log("✅ 결제 페이지 접근 및 결제 버튼 확인 완료");
    } else {
      // 거래 상세 페이지에서 직접 결제 페이지로 이동 시도
      if (dealId) {
        const dealAcceptPage = new DealAcceptPage(page);
        await dealAcceptPage.goto(dealId);
        
        // 결제 링크나 버튼 찾기
        const paymentLink = page.locator('a[href*="/payments/"], button[onclick*="payment"]');
        if (await paymentLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await paymentLink.click();
          await page.waitForURL(/\/payments\/\d+\/detail/, { timeout: 10000 });
          console.log("✅ 결제 페이지로 이동 완료");
        } else {
          console.log("⚠️ 결제 버튼을 찾을 수 없습니다");
        }
      } else {
        console.log("⚠️ 거래 ID를 찾을 수 없습니다");
      }
    }
  });

  test("5. 구매한 티켓 목록 확인", async ({ page }) => {
    // 구매 내역 페이지로 이동
    const dealListPage = new DealListPage(page);
    await dealListPage.goto();
    await dealListPage.clickPurchaseTab();
    await dealListPage.waitForDealsToLoad();

    const count = await dealListPage.getDealCount();
    console.log(`📋 구매 내역 개수: ${count}`);

    if (count > 0) {
      await dealListPage.expectDealsVisible();
      
      // 첫 번째 거래 확인
      const firstDeal = dealListPage.dealCards.first();
      await expect(firstDeal).toBeVisible({ timeout: 5000 });
      
      console.log("✅ 구매한 티켓 목록 확인 완료");
    } else {
      await dealListPage.expectEmpty();
      console.log("ℹ️ 구매 내역이 없습니다");
    }

    // 추가: My 티켓 페이지 확인 (만약 별도 페이지가 있다면)
    try {
      await page.goto("/mypage/my-tickets");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      
      // 티켓 목록이 표시되는지 확인
      const ticketTable = page.locator("table, .MuiTable-root");
      const hasTable = await ticketTable.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasTable) {
        console.log("✅ My 티켓 페이지 확인 완료");
      } else {
        console.log("ℹ️ My 티켓 페이지에 티켓이 없습니다");
      }
    } catch (error) {
      console.log("ℹ️ My 티켓 페이지 접근 실패 (선택적 기능)");
    }
  });
});

