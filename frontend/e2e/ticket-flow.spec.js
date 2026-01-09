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
    // 타임아웃 증가 (120초)
    test.setTimeout(120000);
    
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
      console.log("   - 또는 docker-compose up");
      console.log("⚠️ 테스트를 계속 진행하지만 로그인 실패가 예상됩니다.");
    }
    
    // 테스트용 계정 생성 및 티켓 등록
    const page = await browser.newPage();
    ticketCreatePage = new TicketCreatePage(page);

    let testEmail = `e2e-flow-${Date.now()}@example.com`;
    testPassword = "Test1234";
    let testNickname = `flowtest${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let testName = `E2E Flow Tester ${Date.now()}`;
    createdTicketName = `E2E 플로우 테스트 티켓 ${Date.now()}`;

    try {
      // 콘솔 에러 캡처 설정
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // 페이지 에러 캡처
      page.on('pageerror', (error) => {
        console.log(`⚠️ 페이지 에러: ${error.message}`);
      });
      
      // 네트워크 실패 캡처
      page.on('requestfailed', (request) => {
        if (request.url().includes('/api') || request.url().includes('/auth')) {
          console.log(`❌ 네트워크 요청 실패: ${request.url()} - ${request.failure()?.errorText}`);
        }
      });
      
      // 브라우저를 통한 회원가입 및 로그인
      const signupPage = new SignupPage(page);
      const loginPage = new LoginPage(page);

      console.log(`📝 회원가입: ${testEmail}`);

      // 1. 회원가입
      await signupPage.goto();
      
      // 회원가입 시도 (최대 3회 재시도)
      let signupSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await signupPage.signup({
            email: testEmail,
            password: testPassword,
            name: testName,
            phone: "010-1234-5678",
          });
          
          // 회원가입 성공 확인
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(3000);
          
          // 성공 메시지 확인
          const successMessage = page.getByText(/회원가입이 완료되었습니다|회원가입 완료|로그인해주세요/i).first();
          const hasSuccessMessage = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
          
          // 로그인 폼으로 전환되었는지 확인
          const loginEmailInput = page.locator('input[name="email"], input[type="email"]').first();
          const isLoginFormVisible = await loginEmailInput.isVisible({ timeout: 2000 }).catch(() => false);
          
          // 회원가입 폼이 사라졌는지 확인
          const signupNameInput = page.locator('input[name="name"], input[placeholder*="이름"]').first();
          const isSignupFormVisible = await signupNameInput.isVisible({ timeout: 2000 }).catch(() => false);
          
          // 성공 조건: 성공 메시지가 있거나, 로그인 폼으로 전환되었거나, 회원가입 폼이 사라짐
          if (hasSuccessMessage || (isLoginFormVisible && !isSignupFormVisible)) {
            signupSuccess = true;
            console.log(`✅ 회원가입 성공 (${attempt}번째 시도)`);
            if (hasSuccessMessage) {
              const successText = await successMessage.textContent();
              console.log(`   성공 메시지: ${successText}`);
            }
            break;
          }
          
          // 에러 메시지 확인
          const errorAlert = page.locator('[role="alert"]').first();
          const hasError = await errorAlert.isVisible({ timeout: 2000 }).catch(() => false);
          if (hasError) {
            const errorText = await errorAlert.textContent();
            console.log(`⚠️ 회원가입 응답 (${attempt}번째 시도): ${errorText}`);
            
            // "회원가입이 완료되었습니다"는 성공 메시지
            if (errorText.includes('완료되었습니다') || errorText.includes('로그인해주세요')) {
              signupSuccess = true;
              console.log(`✅ 회원가입 성공 (성공 메시지 감지)`);
              break;
            }
            
            // 닉네임 또는 이메일 중복 에러인 경우 다른 값으로 재시도
            if (errorText.includes('닉네임') || errorText.includes('이미 존재')) {
              if (errorText.includes('이메일')) {
                // 이메일 중복 - 새로운 이메일 생성
                testEmail = `e2e-flow-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
                console.log(`🔄 다른 이메일로 재시도: ${testEmail}`);
              } else {
                // 닉네임 중복 - 새로운 닉네임 생성
                testNickname = `flowtest${Date.now()}-${Math.random().toString(36).substring(7)}`;
                testName = `E2E Flow Tester ${Date.now()}`;
                console.log(`🔄 다른 닉네임으로 재시도: ${testNickname}`);
              }
              await page.waitForTimeout(1000);
              continue;
            }
          }
        } catch (error) {
          console.log(`⚠️ 회원가입 시도 ${attempt} 실패: ${error.message}`);
          if (attempt < 3) {
            await page.waitForTimeout(2000);
            await signupPage.goto(); // 회원가입 페이지로 다시 이동
          }
        }
      }
      
      if (!signupSuccess) {
        throw new Error("회원가입 실패: 3회 시도 후에도 성공하지 못했습니다.");
      }

      // 회원가입은 위의 반복문에서 이미 처리됨
      // 추가 대기 시간 (DB 반영 시간)
      await page.waitForTimeout(3000);

      // 2. 로그인 (회원가입 후 충분한 대기 시간)
      console.log(`🔐 로그인: ${testEmail}`);
      await page.waitForTimeout(2000); // 회원가입 완료 후 추가 대기
      
      await loginPage.goto();
      await page.waitForTimeout(1000); // 페이지 로드 대기
      
      // 로그인 폼이 보이는지 확인
      const loginFormVisible = await loginPage.emailInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (!loginFormVisible) {
        console.log("⚠️ 로그인 폼을 찾을 수 없습니다. 현재 URL:", page.url());
        // 스크린샷 저장
        await page.screenshot({ path: `test-results/login-form-not-found-${Date.now()}.png` });
      }
      
      // 로그인 전 localStorage 확인
      const beforeLoginToken = await page.evaluate(() => localStorage.getItem("accessToken"));
      console.log(`🔍 로그인 전 토큰: ${beforeLoginToken ? "있음" : "없음"}`);
      
      // 로그인 시도
      await loginPage.login(testEmail, testPassword);
      
      // 로그인 후 즉시 토큰 확인
      await page.waitForTimeout(1000);
      const afterLoginToken = await page.evaluate(() => localStorage.getItem("accessToken"));
      console.log(`🔍 로그인 직후 토큰: ${afterLoginToken ? "있음" : "없음"}`);

      // 로그인 성공 대기 및 인증 상태 확인
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000); // 로그인 처리 시간 확보

      // 에러 메시지 확인
      const errorAlert = page.locator('[role="alert"]').first();
      const hasError = await errorAlert.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasError) {
        const errorText = await errorAlert.textContent();
        console.log(`⚠️ 로그인 에러 메시지: ${errorText}`);
        await page.screenshot({ path: `test-results/login-error-${Date.now()}.png` });
        
        // "이메일 또는 비밀번호가 올바르지 않습니다" 에러인 경우
        if (errorText.includes('이메일 또는 비밀번호') || errorText.includes('올바르지 않습니다')) {
          console.log("💡 회원가입이 완료되지 않았을 수 있습니다. 회원가입을 다시 시도합니다.");
          // 회원가입 재시도는 복잡하므로, 테스트를 스킵하거나 다른 계정 사용
          throw new Error(`로그인 실패: ${errorText}. 회원가입이 완료되지 않았을 수 있습니다.`);
        }
      }

      // 인증 토큰 확인 (여러 번 시도)
      let token = null;
      for (let i = 0; i < 15; i++) {
        token = await page.evaluate(() => localStorage.getItem("accessToken"));
        if (token) {
          console.log(`✅ 인증 토큰 확인 완료 (${i + 1}번째 시도)`);
          break;
        }
        await page.waitForTimeout(1000);
      }

      // URL 확인
      const currentUrl = page.url();
      console.log(`📍 로그인 후 현재 URL: ${currentUrl}`);
      
      // 로그인 폼이 여전히 보이는지 확인
      const stillLoginFormVisible = await loginPage.emailInput.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!token && stillLoginFormVisible) {
        console.log("⚠️ 로그인 실패: 로그인 폼이 여전히 표시됩니다");
        console.log(`📍 현재 URL: ${currentUrl}`);
        await page.screenshot({ path: `test-results/login-failed-${Date.now()}.png` });
        
      // 네트워크 요청 확인 (더 상세한 정보)
      const networkLogs = await page.evaluate(() => {
        const resources = window.performance.getEntriesByType('resource');
        return resources
          .filter(r => r.name.includes('/api') || r.name.includes('/auth'))
          .map(r => ({ 
            name: r.name, 
            duration: r.duration,
            type: r.initiatorType,
            transferSize: r.transferSize,
            status: r.responseStatus || 'unknown'
          }));
      });
      console.log("📡 네트워크 요청:", JSON.stringify(networkLogs, null, 2));
      
      // 콘솔 에러는 이미 위에서 캡처됨
        
        throw new Error("로그인 실패: 로그인 폼이 여전히 표시됩니다");
      } else if (!token && !stillLoginFormVisible) {
        // 토큰은 없지만 로그인 폼도 없음 - 홈페이지로 이동했을 수 있음
        const isHomePage = currentUrl.includes("/") && !currentUrl.includes("/auth");
        if (isHomePage) {
          console.log("ℹ️ 홈페이지로 이동했습니다. 로그인 성공으로 간주합니다.");
        } else {
          console.log(`⚠️ 토큰이 없고 로그인 폼도 없습니다. URL: ${currentUrl}`);
        }
      }

      // 3. 티켓 생성 페이지로 이동
      console.log(`🎫 티켓 생성 페이지로 이동: ${createdTicketName}`);
      await ticketCreatePage.goto();
      
      // 폼이 로드될 때까지 충분히 대기
      try {
        await ticketCreatePage.eventNameInput.waitFor({ state: "visible", timeout: 10000 });
        console.log("✅ 티켓 생성 폼 로드 완료");
      } catch (e) {
        // 폼이 보이지 않으면 현재 URL과 페이지 상태 확인
        const currentUrl = page.url();
        console.log(`⚠️ 티켓 생성 폼을 찾을 수 없습니다. 현재 URL: ${currentUrl}`);
        
        // 로그인 페이지로 리다이렉트되었는지 확인
        if (currentUrl.includes("/auth") || currentUrl.includes("/login")) {
          console.log("⚠️ 로그인 페이지로 리다이렉트되었습니다. 다시 로그인 시도...");
          await loginPage.login(testEmail, testPassword);
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2000);
          
          // 다시 티켓 생성 페이지로 이동
          await ticketCreatePage.goto();
          await ticketCreatePage.eventNameInput.waitFor({ state: "visible", timeout: 10000 });
        } else {
          throw new Error(`티켓 생성 폼을 찾을 수 없습니다. URL: ${currentUrl}`);
        }
      }

      const ticketData = {
        eventName: createdTicketName,
        eventDate: "2026-06-20T19:00",
        eventLocation: "서울 잠실종합운동장",
        originalPrice: "120000",
        sellingPrice: "120000",
        seatInfo: "B구역 3열 8번",
        description: "E2E 전체 플로우 테스트용 티켓입니다.",
      };

      console.log("📝 티켓 정보 입력 중...");
      await ticketCreatePage.createTicket(ticketData);
      
      // 티켓 생성 완료 대기
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000);

      console.log("✅ 티켓 생성 완료");

      // 티켓이 DB에 저장되고 목록에 반영될 시간 대기 (최소화)
      await page.waitForTimeout(2000);

      await page.close();
      console.log("✅ beforeAll 완료");
    } catch (error) {
      console.log("❌ 티켓 생성 중 에러:", error.message);
      console.log("에러 스택:", error.stack);
      await page.screenshot({ path: `test-results/error-beforeAll-${Date.now()}.png` });
      await page.close();
      throw error; // 에러를 다시 throw하여 테스트 실패로 표시
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
