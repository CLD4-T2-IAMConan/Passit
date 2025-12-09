import { useMemo } from "react";

interface PasswordStrength {
  label: string;
  strength: number;
  color: "error" | "warning" | "success" | "grey";
}

/**
 * 비밀번호 강도를 계산하는 커스텀 훅
 * @param password - 검증할 비밀번호
 * @returns 비밀번호 강도 정보 객체
 */
export const usePasswordStrength = (password: string): PasswordStrength => {
  return useMemo(() => {
    if (!password) return { label: "", strength: 0, color: "grey" };

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength < 30) return { label: "약함", strength, color: "error" };
    if (strength < 60) return { label: "보통", strength, color: "warning" };
    return { label: "강함", strength, color: "success" };
  }, [password]);
};
