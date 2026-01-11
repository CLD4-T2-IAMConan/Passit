import { csAPI } from "../../lib/api/client";
import ENDPOINTS from "../endpoints";

/**
 * 공지 목록 조회 (사용자)
 */
export const getNotices = () => {
  return csAPI.get(ENDPOINTS.NOTICES.LIST);
};

/**
 * 공지 상세 조회 (사용자)
 */
export const getNoticeDetail = (noticeId) => {
  return csAPI.get(ENDPOINTS.NOTICES.DETAIL(noticeId));
};

/**
 * 관리자 공지 목록 조회
 */
export const getAdminNotices = () => {
  return csAPI.get(ENDPOINTS.NOTICES.ADMIN_LIST);
};

/**
 * 관리자 공지 상세 조회
 */
export const getAdminNoticeDetail = (noticeId) => {
  return csAPI.get(ENDPOINTS.NOTICES.ADMIN_UPDATE(noticeId));
};

/**
 * 관리자 공지 생성
 */
export const createAdminNotice = (data) => {
  return csAPI.post(ENDPOINTS.NOTICES.ADMIN_CREATE, data);
};

/**
 * 관리자 공지 수정
 */
export const updateAdminNotice = (noticeId, data) => {
  return csAPI.put(ENDPOINTS.NOTICES.ADMIN_UPDATE(noticeId), data);
};

/**
 * 관리자 공지 상태 변경
 */
export const updateAdminNoticeStatus = (noticeId, status) => {
  return csAPI.patch(ENDPOINTS.NOTICES.ADMIN_UPDATE_STATUS(noticeId), { status });
};

/**
 * 관리자 공지 삭제
 */
export const deleteAdminNotice = (noticeId) => {
  return csAPI.delete(ENDPOINTS.NOTICES.ADMIN_DELETE(noticeId));
};
