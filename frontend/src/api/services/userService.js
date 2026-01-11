import { accountAPI } from "../../lib/api/client";
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
    const response = await accountAPI.get(ENDPOINTS.USERS.ME);
    return response.data;
  },

  /**
   * 내 정보 업데이트
   * @param {Object} updates - 업데이트할 정보
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  updateMe: async (updates) => {
    const response = await accountAPI.patch(ENDPOINTS.USERS.UPDATE_ME, updates);
    return response.data;
  },

  /**
   * 계정 삭제
   * @returns {Promise<void>}
   */
  deleteAccount: async () => {
    const response = await accountAPI.delete(ENDPOINTS.USERS.DELETE_ME);
    return response.data;
  },

  /**
   * 비밀번호 변경
   * @param {Object} data - { oldPassword, newPassword }
   * @returns {Promise<void>}
   */
  changePassword: async (data) => {
    const response = await accountAPI.post(ENDPOINTS.USERS.CHANGE_PASSWORD, data);
    return response.data;
  },

  /**
   * 비밀번호 확인
   * @param {string} password - 확인할 비밀번호
   * @returns {Promise<void>}
   */
  verifyPassword: async (password) => {
    const response = await accountAPI.post(ENDPOINTS.USERS.VERIFY_PASSWORD, { password });
    return response.data;
  },

  /**
   * 비밀번호 설정 (소셜 로그인 사용자 전용)
   * @param {Object} data - { newPassword }
   * @returns {Promise<void>}
   */
  setPassword: async (data) => {
    const response = await accountAPI.post(ENDPOINTS.USERS.SET_PASSWORD, data);
    return response.data;
  },
};

export default userService;
