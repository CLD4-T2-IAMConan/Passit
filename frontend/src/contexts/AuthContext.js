/**
 * 인증 상태 관리 Context
 */
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import authService from "../services/authService";
import { handleError } from "../utils/errorHandler";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기화 - localStorage에서 사용자 정보 복원
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = authService.getCurrentUser();
        const token = authService.getAccessToken();

        if (storedUser && token) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        authService.clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * 로그인
   */
  const login = useCallback(async (email, password) => {
    try {
      const data = await authService.login(email, password);

      setUser({
        userId: data.userId,
        email: data.email,
        name: data.name,
        nickname: data.nickname,
        provider: data.provider,
        role: data.role,
      });
      setIsAuthenticated(true);

      return { success: true, data };
    } catch (error) {
      const message = handleError(error);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 회원가입
   */
  const signup = useCallback(async (signupData) => {
    try {
      const data = await authService.signup(signupData);
      return { success: true, data };
    } catch (error) {
      const message = handleError(error);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 이메일 인증 코드 전송
   */
  const sendVerificationCode = useCallback(async (email) => {
    try {
      const data = await authService.sendVerificationCode(email);
      return { success: true, data };
    } catch (error) {
      const message = handleError(error);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 이메일 인증 확인
   */
  const verifyEmail = useCallback(async (email, code) => {
    try {
      const data = await authService.verifyEmail(email, code);
      return { success: true, data };
    } catch (error) {
      const message = handleError(error);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 로그아웃
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * 카카오 로그인 콜백 처리
   */
  const handleKakaoCallback = useCallback((queryParams) => {
    try {
      const data = authService.handleKakaoCallback(queryParams);

      if (data.userId) {
        setUser({
          userId: data.userId,
          email: data.email,
          name: data.name,
          provider: data.provider,
        });
        setIsAuthenticated(true);
      }

      return { success: true, data };
    } catch (error) {
      const message = handleError(error);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 사용자 정보 업데이트 (프로필 수정 후)
   */
  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));

    const currentUser = authService.getCurrentUser();
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  /**
   * 관리자 여부 확인
   */
  const isAdmin = user?.role === "ADMIN";

  const value = {
    user,
    isAuthenticated,
    loading,
    isAdmin,
    login,
    signup,
    sendVerificationCode,
    verifyEmail,
    logout,
    handleKakaoCallback,
    updateUser,
    getKakaoLoginUrl: authService.getKakaoLoginUrl,
    getAccessToken: authService.getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 커스텀 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
