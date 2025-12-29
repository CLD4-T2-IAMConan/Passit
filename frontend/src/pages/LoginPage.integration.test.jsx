import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../contexts/AuthContext";

// Mock userService
jest.mock("../services/userService", () => ({
  userService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

import { userService } from "../services/userService";

/**
 * LoginPage 통합 테스트
 *
 * 테스트 범위:
 * - 페이지 전체 렌더링
 * - API 연동 (모킹)
 * - 라우팅
 * - 전역 상태 업데이트 (AuthContext)
 */

// Mock 대시보드 컴포넌트
const MockDashboard = () => <div>Dashboard Page</div>;
const MockSignupPage = () => <div>Signup Page</div>;

describe("LoginPage Integration Test", () => {
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<MockDashboard />} />
            <Route path="/signup" element={<MockSignupPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Mock 리셋
    jest.clearAllMocks();

    // localStorage 초기화
    localStorage.clear();
  });

  test("로그인 페이지가 올바르게 렌더링된다", () => {
    renderLoginPage();

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("로그인 성공 후 대시보드로 이동", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 이메일과 비밀번호 입력
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // 로그인 버튼 클릭
    await user.click(screen.getByRole("button", { name: /login/i }));

    // 대시보드로 이동 확인
    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });

    // localStorage에 토큰 저장 확인
    expect(localStorage.getItem("authToken")).toBeTruthy();
  });

  test("로그인 실패 시 에러 메시지 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 잘못된 비밀번호로 로그인 시도
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /login/i }));

    // 에러 메시지 표시 확인
    expect(await screen.findByText(/인증 실패/i)).toBeInTheDocument();

    // 여전히 로그인 페이지에 있는지 확인
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  test("존재하지 않는 사용자로 로그인 시도 - 실패", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "nonexistent@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/사용자를 찾을 수 없습니다/i)).toBeInTheDocument();
  });

  test("빈 폼 제출 시 유효성 검사 에러 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 빈 상태로 제출
    await user.click(screen.getByRole("button", { name: /login/i }));

    // 유효성 검사 에러 메시지 확인
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  test("유효하지 않은 이메일 형식 - 에러 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  test("로그인 중에는 버튼이 비활성화되고 로딩 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);

    // 로딩 중 버튼 비활성화 확인 (짧은 시간)
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  test("회원가입 링크 클릭 시 회원가입 페이지로 이동", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const signupLink = screen.getByRole("link", { name: /sign up/i });
    await user.click(signupLink);

    await waitFor(() => {
      expect(screen.getByText("Signup Page")).toBeInTheDocument();
    });
  });

  test("Enter 키로 로그인 가능", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });
  });

  test("비밀번호 표시/숨김 토글 기능", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    // 초기 상태는 password type
    expect(passwordInput).toHaveAttribute("type", "password");

    // 토글 클릭 - 표시
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // 다시 토글 - 숨김
    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("로그인 후 사용자 정보가 Context에 저장됨", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    // Dashboard로 이동 후 사용자 정보 표시 확인
    await waitFor(() => {
      const dashboard = screen.getByText("Dashboard Page");
      expect(dashboard).toBeInTheDocument();
    });

    // AuthContext에서 사용자 정보 사용 가능한지 확인 (실제로는 Dashboard에서 표시)
    expect(localStorage.getItem("authToken")).toContain("mock-jwt-token");
  });
});
