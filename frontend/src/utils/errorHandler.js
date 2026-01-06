/**
 * 에러 핸들링 유틸리티
 */

/**
 * API 에러 메시지 추출
 * @param {Error} error - Axios 에러 객체
 * @returns {string} 사용자에게 표시할 에러 메시지
 */
export const getErrorMessage = (error) => {
  // 네트워크 오류
  if (!error.response) {
    return "네트워크 연결을 확인해주세요.";
  }

  const { status, data } = error.response;

  // 백엔드에서 반환한 메시지가 있으면 우선 사용
  if (data?.message) {
    return data.message;
  }

  // HTTP 상태 코드별 기본 메시지
  switch (status) {
    case 400:
      return "잘못된 요청입니다.";
    case 401:
      return "로그인이 필요합니다.";
    case 403:
      return "권한이 없습니다.";
    case 404:
      return "요청한 리소스를 찾을 수 없습니다.";
    case 409:
      return "이미 존재하는 데이터입니다.";
    case 422:
      return "입력한 정보를 확인해주세요.";
    case 429:
      return "너무 많은 요청입니다. 잠시 후 다시 시도해주세요.";
    case 500:
      return "서버 오류가 발생했습니다.";
    case 503:
      return "서비스를 일시적으로 사용할 수 없습니다.";
    default:
      return "알 수 없는 오류가 발생했습니다.";
  }
};

/**
 * 에러 처리 및 알림 표시
 * @param {Error} error
 * @param {Function} showError - 에러 표시 함수 (예: toast)
 */
export const handleError = (error, showError) => {
  const message = getErrorMessage(error);
  console.error("Error:", error);

  if (showError) {
    showError(message);
  }

  return message;
};

/**
 * 폼 validation 에러 추출
 * @param {Object} error - Axios 에러 객체
 * @returns {Object} 필드별 에러 메시지 객체
 */
export const getValidationErrors = (error) => {
  const errors = {};

  if (error.response?.data?.errors) {
    // Spring Validation 에러 형식
    error.response.data.errors.forEach((err) => {
      errors[err.field] = err.message;
    });
  } else if (error.response?.data?.fieldErrors) {
    // 커스텀 에러 형식
    Object.keys(error.response.data.fieldErrors).forEach((field) => {
      errors[field] = error.response.data.fieldErrors[field];
    });
  }

  return errors;
};

/**
 * 에러 로깅
 * @param {string} context - 에러 발생 위치
 * @param {Error} error - 에러 객체
 * @param {Object} additionalInfo - 추가 정보
 */
export const logError = (context, error, additionalInfo = {}) => {
  const errorLog = {
    context,
    message: error.message,
    stack: error.stack,
    response: error.response?.data,
    status: error.response?.status,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };

  console.error(`[ERROR - ${context}]`, errorLog);

  // 프로덕션 환경에서는 에러 로깅 서비스로 전송
  if (process.env.NODE_ENV === "production") {
    // TODO: Sentry 등의 에러 로깅 서비스로 전송
  }
};

/**
 * 인증 에러 체크
 * @param {Error} error
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * 권한 에러 체크
 * @param {Error} error
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
  return error.response?.status === 403;
};

/**
 * 서버 에러 체크
 * @param {Error} error
 * @returns {boolean}
 */
export const isServerError = (error) => {
  return error.response?.status >= 500;
};

export default {
  getErrorMessage,
  handleError,
  getValidationErrors,
  logError,
  isAuthError,
  isPermissionError,
  isServerError,
};
