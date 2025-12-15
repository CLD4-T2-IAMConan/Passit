import api from "../axiosInstance";
import ENDPOINTS from "../endpoints";

/**
 * 문의(Inquiry) 관련 API
 */

// ===== 유저 =====

// 문의 목록 조회 (내 문의)
export const getMyInquiries = () => {
  return api.get(ENDPOINTS.INQUIRIES.LIST);
};

// 문의 상세 조회
export const getInquiryDetail = (inquiryId) => {
  return api.get(ENDPOINTS.INQUIRIES.DETAIL(inquiryId));
};

// 문의 등록
export const createInquiry = (data) => {
  return api.post(ENDPOINTS.INQUIRIES.CREATE, data);
};

// ===== 관리자 =====

// 관리자 문의 목록
export const getAdminInquiries = () => {
  return api.get(ENDPOINTS.INQUIRIES.ADMIN_LIST);
};

// 관리자 문의 상세
export const getAdminInquiryDetail = (inquiryId) => {
  return api.get(ENDPOINTS.INQUIRIES.ADMIN_DETAIL(inquiryId));
};

// 관리자 답변 등록/수정
export const answerInquiry = (inquiryId, data) => {
  return api.patch(
    ENDPOINTS.INQUIRIES.ADMIN_ANSWER(inquiryId),
    data
  );
};