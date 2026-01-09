/**
 * 통합 에러 핸들러
 *
 * 모든 API 에러를 일관되게 처리
 */

/**
 * 에러 타입 정의
 */
export const ErrorTypes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * 에러 메시지 매핑
 */
const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK_ERROR]: "네트워크 연결을 확인해주세요.",
  [ErrorTypes.AUTH_ERROR]: "인증이 만료되었습니다. 다시 로그인해주세요.",
  [ErrorTypes.PERMISSION_ERROR]: "접근 권한이 없습니다.",
  [ErrorTypes.NOT_FOUND]: "요청한 리소스를 찾을 수 없습니다.",
  [ErrorTypes.SERVER_ERROR]: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  [ErrorTypes.VALIDATION_ERROR]: "입력한 정보를 확인해주세요.",
  [ErrorTypes.UNKNOWN_ERROR]: "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

/**
 * 에러 타입 판별
 */
export const getErrorType = (error) => {
  if (!error.response) {
    return ErrorTypes.NETWORK_ERROR;
  }

  const status = error.response.status;

  if (status === 401) {
    return ErrorTypes.AUTH_ERROR;
  }

  if (status === 403) {
    return ErrorTypes.PERMISSION_ERROR;
  }

  if (status === 404) {
    return ErrorTypes.NOT_FOUND;
  }

  if (status === 422 || status === 400) {
    return ErrorTypes.VALIDATION_ERROR;
  }

  if (status >= 500) {
    return ErrorTypes.SERVER_ERROR;
  }

  return ErrorTypes.UNKNOWN_ERROR;
};

/**
 * 사용자 친화적 에러 메시지 추출
 */
export const getErrorMessage = (error) => {
  // 서버에서 제공한 메시지가 있으면 우선 사용
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // 에러 타입에 따른 기본 메시지
  const errorType = getErrorType(error);
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorTypes.UNKNOWN_ERROR];
};

/**
 * 에러 처리 헬퍼
 */
export const handleError = (error) => {
  const errorType = getErrorType(error);
  const message = getErrorMessage(error);

  console.error(`[${errorType}]`, message, error);

  return {
    type: errorType,
    message,
    status: error.response?.status,
    data: error.response?.data,
    originalError: error,
  };
};

/**
 * 에러가 특정 타입인지 확인
 */
export const isErrorType = (error, type) => {
  return getErrorType(error) === type;
};

export default handleError;
