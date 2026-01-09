/**
 * 고객 지원(CS) 관리 API 서비스
 * CS Service (8085)와 통신
 */
import { csAPI } from "../lib/api/client";
import { ENDPOINTS } from "../api/endpoints";

class CSService {
  // ============================================
  // 공지사항(Notices) 관리
  // ============================================

  /**
   * 공지사항 목록 조회
   * @param {Object} params - { keyword, categoryId, page, size, sortBy, sortDirection }
   * @returns {Promise}
   */
  async getNotices(params = {}) {
    const response = await csAPI.get(ENDPOINTS.NOTICES.LIST, { params });
    return response.data;
  }

  /**
   * 공지사항 상세 조회
   * @param {number} noticeId
   * @returns {Promise}
   */
  async getNoticeDetail(noticeId) {
    const response = await csAPI.get(ENDPOINTS.NOTICES.DETAIL(noticeId));
    return response.data;
  }

  /**
   * 공지사항 생성 (관리자)
   * @param {Object} noticeData - { title, content, categoryId, isPinned, isImportant }
   * @returns {Promise}
   */
  async createNotice(noticeData) {
    const response = await csAPI.post(ENDPOINTS.NOTICES.CREATE, noticeData);
    return response.data;
  }

  /**
   * 공지사항 수정 (관리자)
   * @param {number} noticeId
   * @param {Object} noticeData
   * @returns {Promise}
   */
  async updateNotice(noticeId, noticeData) {
    const response = await csAPI.put(ENDPOINTS.NOTICES.UPDATE(noticeId), noticeData);
    return response.data;
  }

  /**
   * 공지사항 삭제 (관리자)
   * @param {number} noticeId
   * @returns {Promise}
   */
  async deleteNotice(noticeId) {
    const response = await csAPI.delete(ENDPOINTS.NOTICES.DELETE(noticeId));
    return response.data;
  }

  /**
   * 중요 공지사항 조회
   * @returns {Promise}
   */
  async getImportantNotices() {
    const response = await csAPI.get(ENDPOINTS.NOTICES.IMPORTANT);
    return response.data;
  }

  /**
   * 고정 공지사항 조회
   * @returns {Promise}
   */
  async getPinnedNotices() {
    const response = await csAPI.get(ENDPOINTS.NOTICES.PINNED);
    return response.data;
  }

  /**
   * 카테고리별 공지사항 조회
   * @param {number} categoryId
   * @param {Object} params
   * @returns {Promise}
   */
  async getNoticesByCategory(categoryId, params = {}) {
    const response = await csAPI.get(ENDPOINTS.NOTICES.BY_CATEGORY(categoryId), { params });
    return response.data;
  }

  /**
   * 공지사항 검색
   * @param {string} keyword
   * @param {Object} params
   * @returns {Promise}
   */
  async searchNotices(keyword, params = {}) {
    const response = await csAPI.get(ENDPOINTS.NOTICES.SEARCH, {
      params: { keyword, ...params },
    });
    return response.data;
  }

  // ============================================
  // 문의(Inquiries) 관리
  // ============================================

  /**
   * 문의 목록 조회 (내 문의)
   * @param {Object} params - { status, categoryId, page, size }
   * @returns {Promise}
   */
  async getMyInquiries(params = {}) {
    const response = await csAPI.get(ENDPOINTS.INQUIRIES.MY_INQUIRIES, { params });
    return response.data;
  }

  /**
   * 문의 상세 조회
   * @param {number} inquiryId
   * @returns {Promise}
   */
  async getInquiryDetail(inquiryId) {
    const response = await csAPI.get(ENDPOINTS.INQUIRIES.DETAIL(inquiryId));
    return response.data;
  }

  /**
   * 문의 생성
   * @param {Object} inquiryData - { title, content, categoryId, email }
   * @returns {Promise}
   */
  async createInquiry(inquiryData) {
    const response = await csAPI.post(ENDPOINTS.INQUIRIES.CREATE, inquiryData);
    return response.data;
  }

  /**
   * 문의 수정 (본인만)
   * @param {number} inquiryId
   * @param {Object} inquiryData
   * @returns {Promise}
   */
  async updateInquiry(inquiryId, inquiryData) {
    const response = await csAPI.put(ENDPOINTS.INQUIRIES.UPDATE(inquiryId), inquiryData);
    return response.data;
  }

  /**
   * 문의 삭제 (본인만)
   * @param {number} inquiryId
   * @returns {Promise}
   */
  async deleteInquiry(inquiryId) {
    const response = await csAPI.delete(ENDPOINTS.INQUIRIES.DELETE(inquiryId));
    return response.data;
  }

  /**
   * 문의 답변 조회
   * @param {number} inquiryId
   * @returns {Promise}
   */
  async getInquiryAnswer(inquiryId) {
    const response = await csAPI.get(ENDPOINTS.INQUIRIES.ANSWER(inquiryId));
    return response.data;
  }

  // 관리자용 문의 API

  /**
   * 전체 문의 목록 조회 (관리자)
   * @param {Object} params
   * @returns {Promise}
   */
  async getAllInquiriesAdmin(params = {}) {
    const response = await csAPI.get(ENDPOINTS.INQUIRIES.ADMIN.LIST, { params });
    return response.data;
  }

  /**
   * 문의 답변 작성 (관리자)
   * @param {number} inquiryId
   * @param {Object} answerData - { content, answeredBy }
   * @returns {Promise}
   */
  async answerInquiry(inquiryId, answerData) {
    const response = await csAPI.post(ENDPOINTS.INQUIRIES.ADMIN.ANSWER(inquiryId), answerData);
    return response.data;
  }

  /**
   * 문의 상태 변경 (관리자)
   * @param {number} inquiryId
   * @param {string} status - PENDING, ANSWERED, CLOSED
   * @returns {Promise}
   */
  async updateInquiryStatus(inquiryId, status) {
    const response = await csAPI.patch(ENDPOINTS.INQUIRIES.ADMIN.UPDATE_STATUS(inquiryId), {
      status,
    });
    return response.data;
  }

  /**
   * 문의 강제 삭제 (관리자)
   * @param {number} inquiryId
   * @returns {Promise}
   */
  async forceDeleteInquiry(inquiryId) {
    const response = await csAPI.delete(ENDPOINTS.INQUIRIES.ADMIN.DELETE(inquiryId));
    return response.data;
  }

  // ============================================
  // FAQ 관리
  // ============================================

  /**
   * FAQ 목록 조회
   * @param {Object} params - { keyword, categoryId, page, size }
   * @returns {Promise}
   */
  async getFAQs(params = {}) {
    const response = await csAPI.get(ENDPOINTS.FAQ.LIST, { params });
    return response.data;
  }

  /**
   * FAQ 상세 조회
   * @param {number} faqId
   * @returns {Promise}
   */
  async getFAQDetail(faqId) {
    const response = await csAPI.get(ENDPOINTS.FAQ.DETAIL(faqId));
    return response.data;
  }

  /**
   * 카테고리별 FAQ 조회
   * @param {number} categoryId
   * @param {Object} params
   * @returns {Promise}
   */
  async getFAQsByCategory(categoryId, params = {}) {
    const response = await csAPI.get(ENDPOINTS.FAQ.BY_CATEGORY(categoryId), { params });
    return response.data;
  }

  /**
   * 인기 FAQ 조회
   * @param {number} limit
   * @returns {Promise}
   */
  async getPopularFAQs(limit = 10) {
    const response = await csAPI.get(ENDPOINTS.FAQ.POPULAR, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * FAQ 검색
   * @param {string} keyword
   * @param {Object} params
   * @returns {Promise}
   */
  async searchFAQs(keyword, params = {}) {
    const response = await csAPI.get(ENDPOINTS.FAQ.SEARCH, {
      params: { keyword, ...params },
    });
    return response.data;
  }

  // 관리자용 FAQ API

  /**
   * FAQ 생성 (관리자)
   * @param {Object} faqData - { question, answer, categoryId, orderIndex }
   * @returns {Promise}
   */
  async createFAQ(faqData) {
    const response = await csAPI.post(ENDPOINTS.FAQ.ADMIN.CREATE, faqData);
    return response.data;
  }

  /**
   * FAQ 수정 (관리자)
   * @param {number} faqId
   * @param {Object} faqData
   * @returns {Promise}
   */
  async updateFAQ(faqId, faqData) {
    const response = await csAPI.put(ENDPOINTS.FAQ.ADMIN.UPDATE(faqId), faqData);
    return response.data;
  }

  /**
   * FAQ 삭제 (관리자)
   * @param {number} faqId
   * @returns {Promise}
   */
  async deleteFAQ(faqId) {
    const response = await csAPI.delete(ENDPOINTS.FAQ.ADMIN.DELETE(faqId));
    return response.data;
  }

  /**
   * FAQ 순서 변경 (관리자)
   * @param {number} faqId
   * @param {number} orderIndex
   * @returns {Promise}
   */
  async reorderFAQ(faqId, orderIndex) {
    const response = await csAPI.patch(ENDPOINTS.FAQ.ADMIN.REORDER(faqId), { orderIndex });
    return response.data;
  }

  // ============================================
  // 신고(Reports) 관리
  // ============================================

  /**
   * 신고 생성
   * @param {Object} reportData - { targetType, targetId, reason, description }
   * @returns {Promise}
   */
  async createReport(reportData) {
    const response = await csAPI.post(ENDPOINTS.REPORTS.CREATE, reportData);
    return response.data;
  }

  /**
   * 내 신고 목록 조회
   * @param {Object} params - { status, page, size }
   * @returns {Promise}
   */
  async getMyReports(params = {}) {
    const response = await csAPI.get(ENDPOINTS.REPORTS.MY_REPORTS, { params });
    return response.data;
  }

  /**
   * 신고 상세 조회
   * @param {number} reportId
   * @returns {Promise}
   */
  async getReportDetail(reportId) {
    const response = await csAPI.get(ENDPOINTS.REPORTS.DETAIL(reportId));
    return response.data;
  }

  /**
   * 신고 취소 (본인만)
   * @param {number} reportId
   * @returns {Promise}
   */
  async cancelReport(reportId) {
    const response = await csAPI.delete(ENDPOINTS.REPORTS.CANCEL(reportId));
    return response.data;
  }

  // 관리자용 신고 API

  /**
   * 전체 신고 목록 조회 (관리자)
   * @param {Object} params - { status, targetType, page, size }
   * @returns {Promise}
   */
  async getAllReportsAdmin(params = {}) {
    const response = await csAPI.get(ENDPOINTS.REPORTS.ADMIN.LIST, { params });
    return response.data;
  }

  /**
   * 신고 처리 (관리자)
   * @param {number} reportId
   * @param {Object} processData - { status, adminNote, action }
   * @returns {Promise}
   */
  async processReport(reportId, processData) {
    const response = await csAPI.post(ENDPOINTS.REPORTS.ADMIN.PROCESS(reportId), processData);
    return response.data;
  }

  /**
   * 신고 상태 변경 (관리자)
   * @param {number} reportId
   * @param {string} status - PENDING, PROCESSING, COMPLETED, REJECTED
   * @returns {Promise}
   */
  async updateReportStatus(reportId, status) {
    const response = await csAPI.patch(ENDPOINTS.REPORTS.ADMIN.UPDATE_STATUS(reportId), { status });
    return response.data;
  }

  /**
   * 신고 통계 조회 (관리자)
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise}
   */
  async getReportStatistics(params = {}) {
    const response = await csAPI.get(ENDPOINTS.REPORTS.ADMIN.STATISTICS, { params });
    return response.data;
  }

  // ============================================
  // 가이드(Guides) 관리
  // ============================================

  /**
   * 가이드 목록 조회
   * @param {Object} params - { categoryId, page, size }
   * @returns {Promise}
   */
  async getGuides(params = {}) {
    const response = await csAPI.get(ENDPOINTS.GUIDES.LIST, { params });
    return response.data;
  }

  /**
   * 가이드 상세 조회
   * @param {number} guideId
   * @returns {Promise}
   */
  async getGuideDetail(guideId) {
    const response = await csAPI.get(ENDPOINTS.GUIDES.DETAIL(guideId));
    return response.data;
  }

  /**
   * 카테고리별 가이드 조회
   * @param {number} categoryId
   * @param {Object} params
   * @returns {Promise}
   */
  async getGuidesByCategory(categoryId, params = {}) {
    const response = await csAPI.get(ENDPOINTS.GUIDES.BY_CATEGORY(categoryId), { params });
    return response.data;
  }

  /**
   * 가이드 검색
   * @param {string} keyword
   * @param {Object} params
   * @returns {Promise}
   */
  async searchGuides(keyword, params = {}) {
    const response = await csAPI.get(ENDPOINTS.GUIDES.SEARCH, {
      params: { keyword, ...params },
    });
    return response.data;
  }

  // 관리자용 가이드 API

  /**
   * 가이드 생성 (관리자)
   * @param {Object} guideData - { title, content, categoryId, orderIndex }
   * @returns {Promise}
   */
  async createGuide(guideData) {
    const response = await csAPI.post(ENDPOINTS.GUIDES.ADMIN.CREATE, guideData);
    return response.data;
  }

  /**
   * 가이드 수정 (관리자)
   * @param {number} guideId
   * @param {Object} guideData
   * @returns {Promise}
   */
  async updateGuide(guideId, guideData) {
    const response = await csAPI.put(ENDPOINTS.GUIDES.ADMIN.UPDATE(guideId), guideData);
    return response.data;
  }

  /**
   * 가이드 삭제 (관리자)
   * @param {number} guideId
   * @returns {Promise}
   */
  async deleteGuide(guideId) {
    const response = await csAPI.delete(ENDPOINTS.GUIDES.ADMIN.DELETE(guideId));
    return response.data;
  }

  /**
   * 가이드 순서 변경 (관리자)
   * @param {number} guideId
   * @param {number} orderIndex
   * @returns {Promise}
   */
  async reorderGuide(guideId, orderIndex) {
    const response = await csAPI.patch(ENDPOINTS.GUIDES.ADMIN.REORDER(guideId), { orderIndex });
    return response.data;
  }

  // ============================================
  // 카테고리(Categories) 관리
  // ============================================

  /**
   * 카테고리 목록 조회
   * @param {string} type - NOTICE, INQUIRY, FAQ, GUIDE
   * @returns {Promise}
   */
  async getCategories(type) {
    const response = await csAPI.get(ENDPOINTS.CATEGORIES.LIST, {
      params: { type },
    });
    return response.data;
  }

  /**
   * 카테고리 상세 조회
   * @param {number} categoryId
   * @returns {Promise}
   */
  async getCategoryDetail(categoryId) {
    const response = await csAPI.get(ENDPOINTS.CATEGORIES.DETAIL(categoryId));
    return response.data;
  }

  // 관리자용 카테고리 API

  /**
   * 카테고리 생성 (관리자)
   * @param {Object} categoryData - { name, type, description, orderIndex }
   * @returns {Promise}
   */
  async createCategory(categoryData) {
    const response = await csAPI.post(ENDPOINTS.CATEGORIES.ADMIN.CREATE, categoryData);
    return response.data;
  }

  /**
   * 카테고리 수정 (관리자)
   * @param {number} categoryId
   * @param {Object} categoryData
   * @returns {Promise}
   */
  async updateCategory(categoryId, categoryData) {
    const response = await csAPI.put(ENDPOINTS.CATEGORIES.ADMIN.UPDATE(categoryId), categoryData);
    return response.data;
  }

  /**
   * 카테고리 삭제 (관리자)
   * @param {number} categoryId
   * @returns {Promise}
   */
  async deleteCategory(categoryId) {
    const response = await csAPI.delete(ENDPOINTS.CATEGORIES.ADMIN.DELETE(categoryId));
    return response.data;
  }

  /**
   * 카테고리 순서 변경 (관리자)
   * @param {number} categoryId
   * @param {number} orderIndex
   * @returns {Promise}
   */
  async reorderCategory(categoryId, orderIndex) {
    const response = await csAPI.patch(ENDPOINTS.CATEGORIES.ADMIN.REORDER(categoryId), {
      orderIndex,
    });
    return response.data;
  }
}

export default new CSService();
