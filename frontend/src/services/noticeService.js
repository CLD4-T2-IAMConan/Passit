import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";

// 공지 목록 조회 (사용자)
export const getNotices = () => {
  return axiosInstance.get(ENDPOINTS.NOTICE.USER_LIST);
};

// 공지 상세 조회 (사용자)
export const getNoticeDetail = (noticeId) => {
  return axiosInstance.get(ENDPOINTS.NOTICE.DETAIL(noticeId));
};

// 공지 생성 (관리자)
export const createAdminNotice = (payload) => {
  return axiosInstance.post(ENDPOINTS.NOTICE.ADMIN_CREATE, payload);
};
