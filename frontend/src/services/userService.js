/**
 * 레거시 호환성을 위한 userService
 * 새로운 API 서비스로 리다이렉트
 */

import { authService } from "../api/services/authService";
import { emailService } from "../api/services/emailService";

export const userService = {
  // 인증 관련
  login: authService.login,
  register: authService.register,
  logout: authService.logout,

  // 이메일 인증 관련
  sendPasswordResetCode: emailService.sendPasswordResetCode,
  verifyPasswordResetCode: emailService.verifyPasswordResetCode,
  resetPassword: emailService.resetPassword,
  sendVerificationCode: emailService.sendVerificationCode,
  verifyCode: emailService.verifyCode,
};

export default userService;
