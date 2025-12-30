/**
 * 인증 관련 API 서비스
 * Account Service (8081)와 통신
 */
import { accountAPI } from "../api/axiosInstances";
import { ENDPOINTS } from "../api/endpoints";

class AuthService {
  /**
   * 회원가입
   * @param {Object} signupData - { email, password, name, nickname, phone }
   * @returns {Promise}
   */
  async signup(signupData) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.SIGNUP, signupData);
    return response.data;
  }

  /**
   * 이메일 인증 코드 전송
   * @param {string} email
   * @returns {Promise}
   */
  async sendVerificationCode(email) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.SEND_VERIFICATION_CODE, { email });
    return response.data;
  }

  /**
   * 이메일 인증 코드 확인
   * @param {string} email
   * @param {string} code
   * @returns {Promise}
   */
  async verifyEmail(email, code) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
    return response.data;
  }

  /**
   * 로그인
   * @param {string} email
   * @param {string} password
   * @returns {Promise} { accessToken, refreshToken, userId, email, name, ... }
   */
  async login(email, password) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    const { data } = response.data;

    // 토큰과 사용자 정보를 localStorage에 저장
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    if (data.userId) {
      const userInfo = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        nickname: data.nickname,
        provider: data.provider,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(userInfo));
    }

    return data;
  }

  /**
   * 로그아웃
   * @returns {Promise}
   */
  async logout() {
    try {
      await accountAPI.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      // API 실패 여부와 관계없이 로컬 데이터 정리
      this.clearAuthData();
    }
  }

  /**
   * Access Token 갱신
   * @param {string} refreshToken
   * @returns {Promise}
   */
  async refreshToken(refreshToken) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });
    const { accessToken } = response.data.data;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }

    return response.data;
  }

  /**
   * 카카오 로그인 URL 가져오기
   * @returns {string}
   */
  getKakaoLoginUrl() {
    const baseURL = process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081";
    return `${baseURL}${ENDPOINTS.AUTH.KAKAO}`;
  }

  /**
   * 카카오 로그인 콜백 처리 (URL에서 토큰 추출)
   * @param {Object} queryParams - { token, refreshToken, userId, email, name, provider }
   */
  handleKakaoCallback(queryParams) {
    const { token, refreshToken, userId, email, name, provider } = queryParams;

    if (token) {
      localStorage.setItem("accessToken", token);
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    if (userId) {
      const userInfo = {
        userId,
        email,
        name,
        provider: provider || "KAKAO",
      };
      localStorage.setItem("user", JSON.stringify(userInfo));
    }

    return {
      accessToken: token,
      refreshToken,
      userId,
      email,
      name,
      provider,
    };
  }

  /**
   * 현재 로그인 상태 확인
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  }

  /**
   * 현재 사용자 정보 가져오기
   * @returns {Object|null}
   */
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Access Token 가져오기
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem("accessToken");
  }

  /**
   * Refresh Token 가져오기
   * @returns {string|null}
   */
  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  }

  /**
   * 인증 데이터 모두 삭제
   */
  clearAuthData() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
}

export default new AuthService();
