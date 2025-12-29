import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "./LoginForm";
import { AuthProvider } from "../../contexts/AuthContext";

// Mock userService
jest.mock("../../services/userService", () => ({
  userService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

// Wrapper with all necessary providers
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

const renderWithProviders = (ui, options) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * LoginForm 컴포넌트 단위 테스트
 *
 * 테스트 범위:
 * - 컴포넌트 렌더링
 * - 사용자 입력 처리
 * - 폼 검증
 * - 로그인 성공/실패 처리
 */
describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("로그인 폼이 올바르게 렌더링된다", () => {
    // Arrange & Act
    renderWithProviders(<LoginForm />);

    // Assert
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /로그인/i })).toBeInTheDocument();
  });

  test("이메일과 비밀번호를 입력할 수 있다", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);

    // Act
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // Assert
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  test("빈 폼 제출시 에러 메시지를 표시한다", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    // Act
    const submitButton = screen.getByRole("button", { name: /로그인/i });
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/email and password are required/i)).toBeInTheDocument();
    // expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    // expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  test("유효하지 않은 이메일 형식시 에러 메시지를 표시한다", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    // Act
    await user.type(screen.getByLabelText(/이메일/i), "invalid-email");
    await user.type(screen.getByLabelText(/비밀번호/i), "password123");
    await user.click(screen.getByRole("button", { name: /로그인/i }));

    // Assert
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  test("로그인 성공시 onSuccess 콜백이 호출된다", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    // Act
    await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
    await user.type(screen.getByLabelText(/비밀번호/i), "password123");
    await user.click(screen.getByRole("button", { name: /로그인/i }));

    // Assert
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(onSuccess).toHaveBeenCalledWith({
      email: "test@example.com",
    });
  });

  test("로그인 실패시 에러 메시지를 표시한다", async () => {
    // Arrange
    const user = userEvent.setup();
    const onError = jest.fn();

    renderWithProviders(<LoginForm onError={onError} />);

    // Act
    await user.type(screen.getByLabelText(/이메일/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/비밀번호/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /로그인/i }));

    // Assert
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  test("로그인 중에는 버튼이 비활성화된다", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /로그인/i });

    // Act
    await user.type(screen.getByLabelText(/이메일/i), "test@example.com");
    await user.type(screen.getByLabelText(/비밀번호/i), "password123");
    await user.click(submitButton);

    // Assert
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  test("Enter 키로 폼을 제출할 수 있다", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);

    // Act
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.keyboard("{Enter}");

    // Assert
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test("비밀번호 표시/숨김 토글이 작동한다", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    // Act - 비밀번호 입력
    await user.type(passwordInput, "password123");

    // Assert - 초기 상태는 숨김
    expect(passwordInput).toHaveAttribute("type", "password");

    // Act - 토글 클릭
    await user.click(toggleButton);

    // Assert - 비밀번호 표시
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    // Act - 다시 토글 클릭
    await user.click(screen.getByRole("button", { name: /hide password/i }));

    // Assert - 다시 숨김
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
