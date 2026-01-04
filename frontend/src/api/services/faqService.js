import api from "../axiosInstance";
import { ENDPOINTS } from "../endpoints";

// 유저 FAQ 목록
export const getFaqs = async () => {
  const res = await api.get(ENDPOINTS.FAQ.USER_LIST);
  return res.data;
};

// 유저 FAQ 단건
export const getFaqDetail = async (faqId) => {
  const res = await api.get(ENDPOINTS.FAQ.DETAIL(faqId));
  return res.data;
};

// 관리자 FAQ 목록
export const getAdminFaqs = async () => {
  const res = await api.get(ENDPOINTS.FAQ.ADMIN_LIST);
  return res.data;
};

// 관리자 FAQ 생성
export const createFaq = async (payload) => {
  const res = await api.post(ENDPOINTS.FAQ.ADMIN_CREATE, payload);
  return res.data;
};

// 관리자 FAQ 수정
export const updateFaq = async (faqId, payload) => {
  const res = await api.put(ENDPOINTS.FAQ.ADMIN_UPDATE(faqId), payload);
  return res.data;
};

// 관리자 FAQ 삭제
export const deleteFaq = async (faqId) => {
  const res = await api.delete(ENDPOINTS.FAQ.ADMIN_DELETE(faqId));
  return res.data;
};
