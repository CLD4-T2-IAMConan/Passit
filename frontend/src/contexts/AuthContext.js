import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { userService } from "../services/userService";

const AuthContext = createContext(null);

/**
 * AuthContext Provider 컴포넌트
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 초기 인증 상태 확인
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        // 손상된 데이터 정리
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * 로그인 처리
   * @param {string} email - 사용자 이메일
   * @param {string} password - 비밀번호
   * @param {boolean} rememberMe - 로그인 유지 여부
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await userService.login({ email, password });

      // LoginResponse에서 데이터 추출
      const userData = {
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
      };

      // 상태 업데이트
      setUser(userData);
      setToken(response.data.accessToken);
      setIsAuthenticated(true);

      // localStorage에 저장
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.message || "로그인에 실패했습니다",
      };
    }
  };

  /**
   * 회원가입 처리
   * @param {Object} userData - 회원가입 데이터
   */
  const register = async (userData) => {
    try {
      const response = await userService.register(userData);

      // 회원가입 후 자동 로그인
      setUser(response.user);
      setToken(response.token);
      setIsAuthenticated(true);

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      return { success: true, user: response.user };
    } catch (error) {
      return {
        success: false,
        error: error.message || "회원가입에 실패했습니다",
      };
    }
  };

  /**
   * 로그아웃 처리
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
  };

  /**
   * 사용자 정보 업데이트
   * @param {Object} updates - 업데이트할 사용자 정보
   */
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  /**
   * 토큰 업데이트 (예: 토큰 갱신 시)
   * @param {string} newToken - 새로운 토큰
   */
  const updateToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  /**
   * 카카오 로그인 콜백 처리
   * @param {string} accessToken - 액세스 토큰
   * @param {string} refreshToken - 리프레시 토큰
   * @param {number} userId - 사용자 ID
   * @param {string} email - 이메일
   * @param {string} name - 이름
   * @param {string} provider - 소셜 로그인 제공자 (KAKAO 등)
   */
  const handleKakaoCallback = useCallback(
    (accessToken, refreshToken, userId, email, name, provider) => {
      try {
        const userData = {
          userId: parseInt(userId),
          email: email,
          name: decodeURIComponent(name), // URL 디코딩
          role: "USER", // 기본값, 필요시 서버에서 받아올 수 있음
          provider: provider || "KAKAO", // provider 정보 저장
        };

        setUser(userData);
        setToken(accessToken);
        setIsAuthenticated(true);

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(userData));

        return { success: true, user: userData };
      } catch (error) {
        console.error("Error in handleKakaoCallback:", error);
        return { success: false, error: error.message };
      }
    },
    []
  );

  /**
   * 관리자 여부 확인
   */
  const isAdmin = user?.role === "ADMIN";

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    isAdmin,
    login,
    register,
    logout,
    updateUser,
    updateToken,
    handleKakaoCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth 훅 - AuthContext 사용을 위한 커스텀 훅
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
