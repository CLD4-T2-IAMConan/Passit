/**
 * 이메일 유효성 검사
 * @param {string} email - 검사할 이메일 주소
 * @returns {boolean} 유효하면 true, 아니면 false
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // 이메일 정규식: 기본적인 이메일 형식 검증
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-])*@[a-zA-Z0-9]([a-zA-Z0-9-])*(\.[a-zA-Z0-9]([a-zA-Z0-9-])*)+$/;

  // 연속된 점이 있는지 체크
  if (email.includes('..')) {
    return false;
  }

  return emailRegex.test(email);
};

/**
 * 비밀번호 유효성 검사
 * - 최소 8자 이상
 * - 영문자 포함
 * - 숫자 포함
 * @param {string} password - 검사할 비밀번호
 * @returns {boolean} 유효하면 true, 아니면 false
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // 공백만 있는 경우 제외
  if (password.trim() === '') {
    return false;
  }

  // 최소 8자 이상
  if (password.length < 8) {
    return false;
  }

  // 영문자 포함 여부
  const hasLetter = /[a-zA-Z]/.test(password);

  // 숫자 포함 여부
  const hasNumber = /[0-9]/.test(password);

  return hasLetter && hasNumber;
};

/**
 * 전화번호 유효성 검사 (한국 전화번호)
 * - 형식: 010-1234-5678 또는 01012345678
 * - 유효한 국번: 010, 011, 016, 017, 018, 019
 * @param {string} phone - 검사할 전화번호
 * @returns {boolean} 유효하면 true, 아니면 false
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // 하이픈 제거
  const cleanPhone = phone.replace(/-/g, '');

  // 전화번호 정규식: 010, 011, 016, 017, 018, 019로 시작하는 10-11자리 숫자
  const phoneRegex = /^(010|011|016|017|018|019)\d{7,8}$/;

  return phoneRegex.test(cleanPhone);
};
