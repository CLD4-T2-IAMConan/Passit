import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";

/**
 * 이메일 인증 관련 API 서비스
 */
export const emailService = {
  /**
   * 이메일 인증 코드 발송
   * @param {string} email - 이메일 주소
   * @returns {Promise<void>}
   */
  sendVerificationCode: async (email) => {
    const response = await apiClient.post(ENDPOINTS.EMAIL.SEND_VERIFICATION, {
      email,
    });
    return response.data;
  },

  /**
   * 이메일 인증 코드 검증
   * @param {string} email - 이메일 주소
   * @param {string} code - 인증 코드
   * @returns {Promise<Object>} 검증 결과
   */
  verifyCode: async (email, code) => {
    const response = await apiClient.post(ENDPOINTS.EMAIL.VERIFY_CODE, {
      email,
      code,
    });
    return response.data;
  },

  /**
   * 비밀번호 재설정 코드 발송
   * @param {string} email - 이메일 주소
   * @returns {Promise<void>}
   */
  sendPasswordResetCode: async (email) => {
    const response = await apiClient.post(ENDPOINTS.EMAIL.SEND_PASSWORD_RESET, {
      email,
    });
    return response.data;
  },

  /**
   * 비밀번호 재설정 코드 검증
   * @param {string} email - 이메일 주소
   * @param {string} code - 인증 코드
   * @returns {Promise<Object>} 검증 결과
   */
  verifyPasswordResetCode: async (email, code) => {
    const response = await apiClient.post(ENDPOINTS.EMAIL.VERIFY_PASSWORD_RESET, {
      email,
      code,
    });
    return response.data;
  },

  /**
   * 비밀번호 재설정
   * @param {string} email - 이메일 주소
   * @param {string} newPassword - 새 비밀번호
   * @returns {Promise<void>}
   */
  resetPassword: async (email, newPassword) => {
    const response = await apiClient.post(ENDPOINTS.EMAIL.RESET_PASSWORD, {
      email,
      password: newPassword,
    });
    return response.data;
  },
};

export default emailService;
