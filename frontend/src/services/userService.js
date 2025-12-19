import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";

/**
 * 사용자 관련 API 서비스
 */
export const userService = {
  /**
   * 내 정보 조회
   * @returns {Promise<Object>} 사용자 정보
   */
  getMe: async () => {
    // 1. 로컬스토리지에서 직접 토큰을 꺼냅니다.
    const token = localStorage.getItem('token');

    // 2. 요청 시 headers 옵션에 토큰을 포함시킵니다.
    const response = await apiClient.get(ENDPOINTS.USERS.ME, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  },

  /**
   * 내 정보 업데이트
   * @param {Object} updates - 업데이트할 정보
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  updateMe: async (updates) => {
    const response = await apiClient.patch(ENDPOINTS.USERS.UPDATE, updates);
    return response.data;
  },

  /**
   * 계정 삭제
   * @returns {Promise<void>}
   */
  deleteAccount: async () => {
    const response = await apiClient.delete(ENDPOINTS.USERS.DELETE);
    return response.data;
  },

  /**
   * 비밀번호 변경
   * @param {Object} data - { oldPassword, newPassword }
   * @returns {Promise<void>}
   */
  changePassword: async (data) => {
    const response = await apiClient.post(ENDPOINTS.USERS.CHANGE_PASSWORD, data);
    return response.data;
  },

  /**
   * 비밀번호 확인
   * @param {string} password - 확인할 비밀번호
   * @returns {Promise<void>}
   */
  verifyPassword: async (password) => {
    const response = await apiClient.post("/users/me/verify-password", { password });
    return response.data;
  },

  /**
   * 비밀번호 설정 (소셜 로그인 사용자 전용)
   * @param {Object} data - { newPassword }
   * @returns {Promise<void>}
   */
  setPassword: async (data) => {
    const response = await apiClient.post("/users/me/set-password", data);
    return response.data;
  },
};

export default userService;
