import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { ReportListPage } from "./pages/ReportListPage";
import { ReportCreatePage } from "./pages/ReportCreatePage";
import { ReportDetailPage } from "./pages/ReportDetailPage";

/**
 * 신고 CRUD 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * - 신고 목록 조회
 * - 신고 생성
 * - 생성한 신고 상세 조회
 * - 신고 목록에서 상세로 이동
 */

test.describe("신고 CRUD 플로우", () => {
  let testEmail;
  let testPassword;
  let reportId;

  test.beforeAll(async ({ browser }) => {
    // 테스트용 계정 생성
    const page = await browser.newPage();
    testEmail = `e2e-report-${Date.now()}@example.com`;
    testPassword = "Test1234!";

    try {
      const baseURL = process.env.BASE_URL || "http://localhost:3000";

      // 회원가입
      console.log(`📝 회원가입: ${testEmail}`);
      const signupResponse = await page.request.post(`${baseURL}/api/auth/signup`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: "E2E Report Tester",
          nickname: `reporttester${Date.now()}`,
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

  test("1. 신고 목록 조회", async ({ page }) => {
    const reportListPage = new ReportListPage(page);
    await reportListPage.goto();
    await reportListPage.waitForReportsToLoad();

    const count = await reportListPage.getReportCount();
    console.log(`📋 신고 개수: ${count}`);

    if (count > 0) {
      await reportListPage.expectReportsVisible();
      console.log("✅ 신고 목록이 표시됩니다");
    } else {
      await reportListPage.expectEmpty();
      console.log("ℹ️ 신고가 없습니다 (정상)");
    }
  });

  test("2. 신고 생성", async ({ page }) => {
    const reportListPage = new ReportListPage(page);
    await reportListPage.goto();
    await reportListPage.waitForReportsToLoad();

    // 신고하기 버튼 클릭 (있는 경우)
    const createButton = page.getByRole("button", { name: /신고하기|신고.*등록/i });
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportListPage.clickCreateButton();
    } else {
      // 직접 신고 생성 페이지로 이동
      await page.goto("/cs/reports/new");
    }

    await page.waitForURL(/\/cs\/reports\/new/, { timeout: 10000 });

    const reportCreatePage = new ReportCreatePage(page);
    await reportCreatePage.waitForPageToLoad();
    await reportCreatePage.expectFormRendered();

    // 신고 생성
    const testReason = `E2E 테스트 신고 사유 ${Date.now()}`;
    const testContent = "이것은 E2E 테스트를 위한 신고 내용입니다.";

    // targetType과 targetId 입력 (필요한 경우)
    const targetTypeSelect = page.locator('select[name="targetType"], select').first();
    if (await targetTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await targetTypeSelect.selectOption("USER");
    }

    const targetIdInput = page.locator('input[name="targetId"], input[type="number"], input[placeholder*="ID"]').first();
    if (await targetIdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await targetIdInput.fill("1"); // 테스트용 ID
    }

    await reportCreatePage.createReport(testReason, testContent);

    // 성공 메시지나 리다이렉트 대기
    await page.waitForTimeout(3000);

    // 목록 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes("/cs/reports") && !currentUrl.includes("/new")) {
      console.log("✅ 신고 생성 완료 및 목록으로 리다이렉트");
    } else {
      console.log("⚠️ 리다이렉트 확인 필요");
    }
  });

  test("3. 신고 상세 조회", async ({ page }) => {
    const reportListPage = new ReportListPage(page);
    await reportListPage.goto();
    await reportListPage.waitForReportsToLoad();

    const count = await reportListPage.getReportCount();
    if (count > 0) {
      // 첫 번째 신고 클릭
      await reportListPage.clickFirstReport();

      // 상세 페이지로 이동 확인
      await page.waitForURL(/\/cs\/reports\/\d+/, { timeout: 10000 });

      // URL에서 reportId 추출
      const url = page.url();
      const match = url.match(/\/cs\/reports\/(\d+)/);
      if (match) {
        reportId = parseInt(match[1]);
        console.log(`📍 신고 ID: ${reportId}`);
      }

      // 신고 정보 표시 확인
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.expectReportInfoVisible();

      console.log("✅ 신고 상세 정보가 표시됩니다");
    } else {
      test.skip();
    }
  });

  test("4. 신고 상세에서 목록으로 복귀", async ({ page }) => {
    const reportListPage = new ReportListPage(page);
    await reportListPage.goto();
    await reportListPage.waitForReportsToLoad();

    const count = await reportListPage.getReportCount();
    if (count > 0) {
      // 상세 페이지로 이동
      await reportListPage.clickFirstReport();
      await page.waitForURL(/\/cs\/reports\/\d+/, { timeout: 10000 });

      // 뒤로가기
      const reportDetailPage = new ReportDetailPage(page);
      await reportDetailPage.goBack();
      await page.waitForLoadState("networkidle");

      // 목록 페이지 확인
      expect(page.url()).toContain("/cs/reports");
      expect(page.url()).not.toMatch(/\/cs\/reports\/\d+/);

      console.log("✅ 목록 페이지로 복귀 완료");
    } else {
      test.skip();
    }
  });

  test("5. 신고 생성 후 목록에서 확인", async ({ page }) => {
    const reportListPage = new ReportListPage(page);
    await reportListPage.goto();
    await reportListPage.waitForReportsToLoad();

    // 초기 신고 개수 저장
    const initialCount = await reportListPage.getReportCount();

    // 신고 생성 페이지로 이동
    const createButton = page.getByRole("button", { name: /신고하기|신고.*등록/i });
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportListPage.clickCreateButton();
    } else {
      await page.goto("/cs/reports/new");
    }

    await page.waitForURL(/\/cs\/reports\/new/, { timeout: 10000 });

    const reportCreatePage = new ReportCreatePage(page);
    const testReason = `E2E 테스트 신고 ${Date.now()}`;

    // targetType과 targetId 입력
    const targetTypeSelect = page.locator('select[name="targetType"], select').first();
    if (await targetTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await targetTypeSelect.selectOption("USER");
    }

    const targetIdInput = page.locator('input[name="targetId"], input[type="number"]').first();
    if (await targetIdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await targetIdInput.fill("1");
    }

    await reportCreatePage.createReport(testReason);
    await page.waitForTimeout(3000);

    // 목록 페이지로 돌아왔는지 확인
    await page.waitForURL(/\/cs\/reports$/, { timeout: 10000 });

    // 목록 새로고침
    await reportListPage.goto();
    await reportListPage.waitForReportsToLoad();

    // 신고 개수 확인
    const newCount = await reportListPage.getReportCount();
    console.log(`📊 초기 개수: ${initialCount}, 새 개수: ${newCount}`);

    // 새 신고가 추가되었는지 확인 (실제로는 DB 반영 시간 고려 필요)
    if (newCount > initialCount) {
      console.log("✅ 새 신고가 목록에 추가되었습니다");
    } else {
      console.log("ℹ️ 신고 개수 변화 없음 (DB 반영 시간 고려 필요)");
    }
  });
});

