import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../contexts/AuthContext";
import { userService } from "../services/userService";

// Mock userService
jest.mock("../services/userService", () => ({
  userService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

/**
 * LoginPage 통합 테스트
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
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("로그인 페이지가 올바르게 렌더링된다", () => {
    renderLoginPage();

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("로그인 성공 후 대시보드로 이동", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");

    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });

    expect(localStorage.getItem("authToken")).toBeTruthy();
  });

  test("로그인 실패 시 에러 메시지 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/인증 실패/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  test("존재하지 않는 사용자로 로그인 시도 - 실패", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/email/i), "nonexistent@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/사용자를 찾을 수 없습니다/i)).toBeInTheDocument();
  });

  test("빈 폼 제출 시 유효성 검사 에러 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  test("유효하지 않은 이메일 형식 - 에러 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/email/i), "invalid-email");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  test("로그인 중에는 버튼이 비활성화되고 로딩 표시", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");

    const submitButton = screen.getByRole("button", { name: /login/i });
    await user.click(submitButton);

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

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

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

    const passwordInput = screen.getByPlaceholderText(/password/i);
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("로그인 후 사용자 정보가 Context에 저장됨", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });

    expect(localStorage.getItem("authToken")).toContain("mock-jwt-token");
  });
});
