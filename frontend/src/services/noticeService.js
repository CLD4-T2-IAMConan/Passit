import { csAPI } from "../lib/api/client";
import { ENDPOINTS } from "../api/endpoints";

// 공지 목록 조회 (사용자)
export const getNotices = () => {
  return csAPI.get(ENDPOINTS.NOTICE.USER_LIST);
};

// 공지 상세 조회 (사용자)
export const getNoticeDetail = (noticeId) => {
  return csAPI.get(ENDPOINTS.NOTICE.DETAIL(noticeId));
};

// 공지 생성 (관리자)
export const createAdminNotice = (payload) => {
  return csAPI.post(ENDPOINTS.NOTICE.ADMIN_CREATE, payload);
};
