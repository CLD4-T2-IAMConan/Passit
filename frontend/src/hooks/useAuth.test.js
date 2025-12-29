// Mock userService directly - this will be used by AuthContext
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { AuthProvider } from "../contexts/AuthContext";
import * as userServiceModule from "../services/userService";

jest.mock("../services/userService", () => {
  const mockUserService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    sendPasswordResetCode: jest.fn(),
    verifyPasswordResetCode: jest.fn(),
    resetPassword: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };
  return {
    userService: mockUserService,
    __esModule: true,
    default: mockUserService,
  };
});

// Wrapper component to provide AuthContext
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

/**
 * useAuth 커스텀 훅 테스트
 *
 * 테스트 범위:
 * - 초기 상태
 * - 로그인/로그아웃
 * - 토큰 관리
 * - 사용자 정보 관리
 */
describe("useAuth", () => {
  // 타임아웃 증가
  jest.setTimeout(10000);

  beforeEach(() => {
    // 각 테스트 전에 localStorage 초기화
    localStorage.clear();
    // Mock 리셋
    jest.clearAllMocks();
  });

  test("초기 상태는 로그인되지 않음", async () => {
    // Arrange & Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert - loading이 false가 될 때까지 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("로그인 성공시 사용자 정보가 설정된다", async () => {
    // Arrange
    // authService.login은 response.data를 반환하므로, 직접 { success, data } 형식으로 모킹
    const mockLoginResponse = {
      success: true,
      data: {
        userId: 1,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
      message: "로그인 성공",
    };

    userServiceModule.userService.login.mockResolvedValue(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    let loginResponse;
    await act(async () => {
      loginResponse = await result.current.login("test@example.com", "password123");
    });

    // Assert - login 함수는 { success, user } 또는 { success, error }를 반환
    expect(loginResponse).toBeDefined();

    // 모킹이 제대로 작동했는지 확인
    expect(userServiceModule.userService.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(loginResponse.success).toBe(true);

    // 상태 업데이트 확인
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeTruthy();
    expect(result.current.user.email).toBe("test@example.com");
    expect(localStorage.getItem("token")).toBeTruthy();
  });

  test("로그인 실패시 에러가 발생한다", async () => {
    // Arrange
    const mockError = {
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            message: "이메일 또는 비밀번호가 일치하지 않습니다",
          },
        },
      },
    };

    userServiceModule.userService.login.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Act
    await act(async () => {
      const response = await result.current.login("wrong@example.com", "wrongpassword");
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("로그아웃시 사용자 정보가 초기화된다", async () => {
    // Arrange
    const mockLoginResponse = {
      success: true,
      data: {
        userId: 1,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    };

    userServiceModule.userService.login.mockResolvedValue(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 먼저 로그인
    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    // 로그인 상태 확인
    expect(result.current.isAuthenticated).toBe(true);

    // Act - 로그아웃
    act(() => {
      result.current.logout();
    });

    // Assert
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("localStorage에 토큰이 있으면 자동 로그인된다", async () => {
    // Arrange
    const mockToken = "mock-jwt-token";
    const mockUser = { userId: 1, email: "test@example.com", name: "Test User", role: "USER" };
    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(result.current.user.email).toBe("test@example.com");
    });
  });

  test("사용자 정보 업데이트가 작동한다", async () => {
    // Arrange
    const mockLoginResponse = {
      success: true,
      data: {
        userId: 1,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    };

    userServiceModule.userService.login.mockResolvedValue(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    // 로그인 상태 확인
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeTruthy();

    // Act
    act(() => {
      result.current.updateUser({
        name: "Updated Name",
        phone: "010-1234-5678",
      });
    });

    // Assert
    expect(result.current.user.name).toBe("Updated Name");
    expect(result.current.user.phone).toBe("010-1234-5678");
  });

  test("토큰 업데이트가 작동한다", async () => {
    // Arrange
    const mockLoginResponse = {
      success: true,
      data: {
        userId: 1,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    };

    userServiceModule.userService.login.mockResolvedValue(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    // 로그인 상태 확인
    expect(result.current.isAuthenticated).toBe(true);
    const oldToken = localStorage.getItem("token");
    expect(oldToken).toBeTruthy();

    // Act
    act(() => {
      result.current.updateToken("new-token-123");
    });

    // Assert
    const newToken = localStorage.getItem("token");
    expect(newToken).toBe("new-token-123");
    expect(newToken).not.toBe(oldToken);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
