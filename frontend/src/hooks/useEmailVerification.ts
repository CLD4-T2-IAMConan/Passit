import { useState } from "react";
import { userService } from "../services/userService";

interface ValidationResult {
  valid: boolean;
  error: string | null;
}

interface VerificationResult {
  success: boolean;
  error: string | null;
}

interface UseEmailVerificationReturn {
  emailSent: boolean;
  emailVerified: boolean;
  sendingEmail: boolean;
  verifyingCode: boolean;
  validateEmail: (email: string) => ValidationResult;
  sendVerificationCode: (
    email: string,
    onSuccess?: () => void,
    isPasswordReset?: boolean
  ) => Promise<VerificationResult>;
  verifyCode: (
    email: string,
    code: string,
    onSuccess?: () => void,
    isPasswordReset?: boolean
  ) => Promise<VerificationResult>;
  reset: () => void;
}

/**
 * 이메일 인증 로직을 관리하는 커스텀 훅
 * @returns 이메일 인증 관련 상태와 함수들
 */
export const useEmailVerification = (): UseEmailVerificationReturn => {
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  /**
   * 이메일 유효성 검사
   */
  const validateEmail = (email: string): ValidationResult => {
    if (!email) {
      return { valid: false, error: "이메일 주소를 입력해주세요" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: "이메일 형식을 확인해주세요 (예: name@example.com)",
      };
    }

    return { valid: true, error: null };
  };

  /**
   * 인증 코드 발송
   */
  const sendVerificationCode = async (
    email: string,
    onSuccess?: () => void,
    isPasswordReset: boolean = false
  ): Promise<VerificationResult> => {
    const validation = validateEmail(email);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    setSendingEmail(true);

    try {
      if (isPasswordReset) {
        // @ts-ignore
        await userService.sendPasswordResetCode(email);
      } else {
        // TODO: API 연동 - 이메일 인증 코드 발송
        // await userService.sendVerificationCode(email);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setEmailSent(true);
      if (onSuccess) onSuccess();
      return { success: true, error: null };
    } catch (err) {
      const error =
        err instanceof Error
          ? err.message
          : "인증 코드를 보내는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요";
      return {
        success: false,
        error,
      };
    } finally {
      setSendingEmail(false);
    }
  };

  /**
   * 인증 코드 검증
   */
  const verifyCode = async (
    email: string,
    code: string,
    onSuccess?: () => void,
    isPasswordReset: boolean = false
  ): Promise<VerificationResult> => {
    if (!code) {
      return { success: false, error: "인증 코드를 입력해주세요" };
    }

    setVerifyingCode(true);

    try {
      if (isPasswordReset) {
        // @ts-ignore
        await userService.verifyPasswordResetCode(email, code);
      } else {
        // TODO: API 연동 - 인증 코드 검증
        // await userService.verifyCode(email, code);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 임시: 테스트용 코드 "123456"
        if (code !== "123456") {
          return {
            success: false,
            error: "인증 코드가 일치하지 않아요. 다시 확인해주세요",
          };
        }
      }

      setEmailVerified(true);
      if (onSuccess) onSuccess();
      return { success: true, error: null };
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "인증 코드를 확인하는 중 문제가 발생했어요";
      return {
        success: false,
        error,
      };
    } finally {
      setVerifyingCode(false);
    }
  };

  /**
   * 상태 초기화
   */
  const reset = (): void => {
    setEmailSent(false);
    setEmailVerified(false);
    setSendingEmail(false);
    setVerifyingCode(false);
  };

  return {
    emailSent,
    emailVerified,
    sendingEmail,
    verifyingCode,
    validateEmail,
    sendVerificationCode,
    verifyCode,
    reset,
  };
};
