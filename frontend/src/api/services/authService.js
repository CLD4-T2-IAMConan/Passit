import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";

/**
 * 인증 관련 API 서비스
 */
export const authService = {
  /**
   * 로그인
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, token }
   */
  login: async (credentials) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  /**
   * 회원가입
   * @param {Object} userData - 사용자 정보
   * @returns {Promise<Object>} { user, token }
   */
  register: async (userData) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  /**
   * 로그아웃
   */
  logout: async () => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  /**
   * 토큰 갱신
   * @returns {Promise<Object>} { token }
   */
  refreshToken: async () => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH);
    return response.data;
  },

  /**
   * 카카오 로그인 URL 가져오기
   * @returns {string} 카카오 로그인 URL
   */
  getKakaoLoginUrl: () => {
    const { API_SERVICES } = require("../../config/apiConfig");
    // API_SERVICES.ACCOUNT는 이미 /api를 포함하고 있으므로 직접 사용
    return `${API_SERVICES.ACCOUNT}${ENDPOINTS.AUTH.KAKAO}`;
  },
};

export default authService;
