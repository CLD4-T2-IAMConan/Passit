import { csApiClient } from "../client";

/**
 * 공지 목록 조회
 */
export const getNotices = () => {
  return csApiClient.get("/api/notices");
};

/**
 * 공지 상세 조회
 */
export const getNoticeDetail = (noticeId) => {
  return csApiClient.get(`/api/notices/${noticeId}`);
};