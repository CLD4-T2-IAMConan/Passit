import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../contexts/AuthContext";
import userService from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import AuthPage from "./AuthPage";

// Mock userService
jest.mock("../services/userService", () => ({
  userService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock("../components/LoginForm", () => (props) => {
  return (
    <button
      onClick={() =>
        props.onLoginSuccess({
          id: 1,
          email: "test@example.com",
          role: "USER",
        })
      }
    >
      로그인
    </button>
  );
});
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
            <Route path="/" element={<MockDashboard />} />
            <Route path="/login" element={<AuthPage />} />
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

    expect(screen.getByRole("heading", { name: /다시 오신 것을 환영합니다/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /로그인/i })).toBeInTheDocument();
  });

  test("로그인 성공 후 메인 페이지로 이동", async () => {
    const user = userEvent.setup();

    userService.login.mockResolvedValueOnce({
      user: { id: 1, email: "test@example.com", role: "USER" },
      token: "fake-token",
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
    await user.type(screen.getByLabelText(/비밀번호/i), "password123");
    await user.click(screen.getByRole("button", { name: /로그인/i }));

    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });
  });

  test("로그인 실패 시 에러 메시지 표시", async () => {
    const user = userEvent.setup();

    userService.login.mockRejectedValueOnce(new Error("Invalid email or password"));

    renderLoginPage();

    await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
    await user.type(screen.getByLabelText(/비밀번호/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /로그인/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  test("회원가입 링크 클릭 시 회원가입 페이지로 이동", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const signupLink = screen.getByRole("button", { name: /회원가입/i });
    await user.click(signupLink);

    expect(screen.getByText(/정가 거래를 시작하세요/i)).toBeInTheDocument();
  });

  test("Enter 키로 로그인 가능", async () => {
    const user = userEvent.setup();

    userService.login.mockResolvedValueOnce({
      user: { id: 1, email: "test@example.com", role: "USER" },
      token: "fake-token",
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
    await user.type(screen.getByLabelText(/비밀번호/i), "password123{Enter}");

    await waitFor(() => {
      expect(localStorage.getItem("authToken")).toBeTruthy();
    });
  });

  test("비밀번호 표시/숨김 토글 기능", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // const ContextConsumer = () => {
  //   const { user } = useAuth();
  //   return <div>{user ? user.email : "NO_USER"}</div>;
  // };

  // test("로그인 후 사용자 정보가 Context에 저장됨", async () => {
  //   const user = userEvent.setup();

  //   userService.login.mockResolvedValueOnce({
  //     user: { id: 1, email: "test@example.com", role: "USER" },
  //     token: "fake-token",
  //   });

  //   render(
  //     <BrowserRouter>
  //       <AuthProvider>
  //         <AuthPage />
  //         <ContextConsumer />
  //       </AuthProvider>
  //     </BrowserRouter>
  //   );

  //   await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
  //   await user.type(screen.getByLabelText(/비밀번호/i), "password123");
  //   await user.click(screen.getByRole("button", { name: /로그인/i }));

  //   await waitFor(() => {
  //     expect(screen.getByText("test@example.com")).toBeInTheDocument();
  //   });

  //   expect(localStorage.getItem("authToken")).toBeTruthy();
  // });
});
