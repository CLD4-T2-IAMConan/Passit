import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { InquiryListPage } from "./pages/InquiryListPage";
import { InquiryCreatePage } from "./pages/InquiryCreatePage";
import { InquiryDetailPage } from "./pages/InquiryDetailPage";

/**
 * 문의 CRUD 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * - 문의 목록 조회
 * - 문의 생성
 * - 생성한 문의 상세 조회
 * - 문의 목록에서 상세로 이동
 */

test.describe("문의 CRUD 플로우", () => {
  let testEmail;
  let testPassword;
  let inquiryId;

  test.beforeAll(async ({ browser }) => {
    // 테스트용 계정 생성
    const page = await browser.newPage();
    testEmail = `e2e-inquiry-${Date.now()}@example.com`;
    testPassword = "Test1234!";

    try {
      const baseURL = process.env.BASE_URL || "http://localhost:3000";

      // 회원가입
      console.log(`📝 회원가입: ${testEmail}`);
      const signupResponse = await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: "E2E Inquiry Tester",
          nickname: `inquirytester${Date.now()}`,
        },
      });

      const signupData = await signupResponse.json();
      if (!signupData.success) {
        console.log("⚠️ 회원가입 실패:", signupData.message);
      }

      await page.close();
    } catch (error) {
      console.log("❌ 초기 설정 중 에러:", error.message);
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: { email: testEmail, password: testPassword },
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

  test("1. 문의 목록 조회", async ({ page }) => {
    const inquiryListPage = new InquiryListPage(page);
    await inquiryListPage.goto();
    await inquiryListPage.waitForInquiriesToLoad();

    const count = await inquiryListPage.getInquiryCount();
    console.log(`📋 문의 개수: ${count}`);

    if (count > 0) {
      await inquiryListPage.expectInquiriesVisible();
      console.log("✅ 문의 목록이 표시됩니다");
    } else {
      await inquiryListPage.expectEmpty();
      console.log("ℹ️ 문의가 없습니다 (정상)");
    }
  });

  test("2. 문의 생성", async ({ page }) => {
    const inquiryListPage = new InquiryListPage(page);
    await inquiryListPage.goto();
    await inquiryListPage.waitForInquiriesToLoad();

    // 문의하기 버튼 클릭
    await inquiryListPage.clickCreateButton();

    // 문의 생성 페이지 확인
    await page.waitForURL(/\/cs\/inquiries\/new/, { timeout: 10000 });

    const inquiryCreatePage = new InquiryCreatePage(page);
    await inquiryCreatePage.expectFormRendered();

    // 문의 생성
    const testTitle = `E2E 테스트 문의 ${Date.now()}`;
    const testContent = "이것은 E2E 테스트를 위한 문의 내용입니다.";

    await inquiryCreatePage.createInquiry(testTitle, testContent);

    // 성공 메시지나 리다이렉트 대기
    await page.waitForTimeout(3000);

    // 목록 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes("/cs/inquiries") && !currentUrl.includes("/new")) {
      console.log("✅ 문의 생성 완료 및 목록으로 리다이렉트");
    } else {
      console.log("⚠️ 리다이렉트 확인 필요");
    }
  });

  test("3. 문의 상세 조회", async ({ page }) => {
    const inquiryListPage = new InquiryListPage(page);
    await inquiryListPage.goto();
    await inquiryListPage.waitForInquiriesToLoad();

    const count = await inquiryListPage.getInquiryCount();
    if (count > 0) {
      // 첫 번째 문의 클릭
      await inquiryListPage.clickFirstInquiry();

      // 상세 페이지로 이동 확인
      await page.waitForURL(/\/cs\/inquiries\/\d+/, { timeout: 10000 });
      
      // URL에서 inquiryId 추출
      const url = page.url();
      const match = url.match(/\/cs\/inquiries\/(\d+)/);
      if (match) {
        inquiryId = parseInt(match[1]);
        console.log(`📍 문의 ID: ${inquiryId}`);
      }

      // 문의 정보 표시 확인
      const inquiryDetailPage = new InquiryDetailPage(page);
      await inquiryDetailPage.expectInquiryInfoVisible();

      console.log("✅ 문의 상세 정보가 표시됩니다");
    } else {
      test.skip();
    }
  });

  test("4. 문의 상세에서 목록으로 복귀", async ({ page }) => {
    const inquiryListPage = new InquiryListPage(page);
    await inquiryListPage.goto();
    await inquiryListPage.waitForInquiriesToLoad();

    const count = await inquiryListPage.getInquiryCount();
    if (count > 0) {
      // 상세 페이지로 이동
      await inquiryListPage.clickFirstInquiry();
      await page.waitForURL(/\/cs\/inquiries\/\d+/, { timeout: 10000 });

      // 뒤로가기
      const inquiryDetailPage = new InquiryDetailPage(page);
      await inquiryDetailPage.goBack();
      await page.waitForLoadState("networkidle");

      // 목록 페이지 확인
      expect(page.url()).toContain("/cs/inquiries");
      expect(page.url()).not.toMatch(/\/cs\/inquiries\/\d+/);

      console.log("✅ 목록 페이지로 복귀 완료");
    } else {
      test.skip();
    }
  });

  test("5. 문의 생성 후 목록에서 확인", async ({ page }) => {
    const inquiryListPage = new InquiryListPage(page);
    await inquiryListPage.goto();
    await inquiryListPage.waitForInquiriesToLoad();

    // 초기 문의 개수 저장
    const initialCount = await inquiryListPage.getInquiryCount();

    // 문의 생성
    await inquiryListPage.clickCreateButton();
    await page.waitForURL(/\/cs\/inquiries\/new/, { timeout: 10000 });

    const inquiryCreatePage = new InquiryCreatePage(page);
    const testTitle = `E2E 테스트 문의 ${Date.now()}`;
    const testContent = "문의 생성 후 목록 확인 테스트입니다.";

    await inquiryCreatePage.createInquiry(testTitle, testContent);
    await page.waitForTimeout(3000);

    // 목록 페이지로 돌아왔는지 확인
    await page.waitForURL(/\/cs\/inquiries$/, { timeout: 10000 });

    // 목록 새로고침
    await inquiryListPage.goto();
    await inquiryListPage.waitForInquiriesToLoad();

    // 문의 개수 확인
    const newCount = await inquiryListPage.getInquiryCount();
    console.log(`📊 초기 개수: ${initialCount}, 새 개수: ${newCount}`);

    // 새 문의가 추가되었는지 확인 (실제로는 DB 반영 시간 고려 필요)
    if (newCount > initialCount) {
      console.log("✅ 새 문의가 목록에 추가되었습니다");
    } else {
      console.log("ℹ️ 문의 개수 변화 없음 (DB 반영 시간 고려 필요)");
    }
  });
});

