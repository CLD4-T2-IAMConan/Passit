/**
 * FAQ 관리 Hook
 */
import { useState, useCallback, useEffect } from "react";
import csService from "../services/csService";
import { handleError } from "../utils/errorHandler";
import { useLoading } from "../contexts/LoadingContext";

export const useFAQ = (initialParams = {}) => {
  const [faqs, setFaqs] = useState([]);
  const [currentFaq, setCurrentFaq] = useState(null);
  const [popularFaqs, setPopularFaqs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });
  const [filters, setFilters] = useState({
    keyword: "",
    categoryId: null,
    sortBy: "orderIndex",
    sortDirection: "ASC",
    ...initialParams,
  });
  const [error, setError] = useState(null);
  const { loading, startLoading, stopLoading } = useLoading();

  /**
   * FAQ 목록 조회
   */
  const fetchFAQs = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const searchParams = {
          ...filters,
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        };

        const response = await csService.getFAQs(searchParams);

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setFaqs(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [filters, pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * FAQ 상세 조회
   */
  const fetchFAQDetail = useCallback(
    async (faqId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.getFAQDetail(faqId);

        if (response.success) {
          setCurrentFaq(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 인기 FAQ 조회
   */
  const fetchPopularFAQs = useCallback(
    async (limit = 10) => {
      try {
        const response = await csService.getPopularFAQs(limit);

        if (response.success) {
          setPopularFaqs(response.data || []);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        console.error("Failed to fetch popular FAQs:", message);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * 카테고리별 FAQ 조회
   */
  const fetchFAQsByCategory = useCallback(
    async (categoryId, params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.getFAQsByCategory(categoryId, {
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setFaqs(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * FAQ 검색
   */
  const searchFAQs = useCallback(
    async (keyword, params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.searchFAQs(keyword, {
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setFaqs(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [pagination.page, pagination.size, startLoading, stopLoading]
  );

  // ============================================
  // 관리자 기능
  // ============================================

  /**
   * FAQ 생성 (관리자)
   */
  const createFAQ = useCallback(
    async (faqData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.createFAQ(faqData);

        if (response.success) {
          setCurrentFaq(response.data);
          // 목록 새로고침
          await fetchFAQs();
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [fetchFAQs, startLoading, stopLoading]
  );

  /**
   * FAQ 수정 (관리자)
   */
  const updateFAQ = useCallback(
    async (faqId, faqData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.updateFAQ(faqId, faqData);

        if (response.success) {
          setCurrentFaq(response.data);
          // 목록 새로고침
          await fetchFAQs();
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [fetchFAQs, startLoading, stopLoading]
  );

  /**
   * FAQ 삭제 (관리자)
   */
  const deleteFAQ = useCallback(
    async (faqId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.deleteFAQ(faqId);

        if (response.success) {
          setCurrentFaq(null);
          setFaqs((prev) => prev.filter((faq) => faq.id !== faqId));
          return { success: true };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * FAQ 순서 변경 (관리자)
   */
  const reorderFAQ = useCallback(
    async (faqId, orderIndex) => {
      try {
        setError(null);

        const response = await csService.reorderFAQ(faqId, orderIndex);

        if (response.success) {
          // 목록 새로고침
          await fetchFAQs();
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      }
    },
    [fetchFAQs]
  );

  /**
   * 검색어 업데이트
   */
  const updateKeyword = useCallback((keyword) => {
    setFilters((prev) => ({ ...prev, keyword }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 카테고리 필터 업데이트
   */
  const updateCategory = useCallback((categoryId) => {
    setFilters((prev) => ({ ...prev, categoryId }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 필터 업데이트
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 페이지 변경
   */
  const changePage = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  /**
   * 페이지 크기 변경
   */
  const changePageSize = useCallback((newSize) => {
    setPagination((prev) => ({ ...prev, size: newSize, page: 0 }));
  }, []);

  /**
   * 정렬 변경
   */
  const changeSorting = useCallback((sortBy, sortDirection = "ASC") => {
    setFilters((prev) => ({ ...prev, sortBy, sortDirection }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 필터 초기화
   */
  const resetFilters = useCallback(() => {
    setFilters({
      keyword: "",
      categoryId: null,
      sortBy: "orderIndex",
      sortDirection: "ASC",
    });
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 현재 FAQ 초기화
   */
  const resetCurrentFaq = useCallback(() => {
    setCurrentFaq(null);
  }, []);

  /**
   * 새로고침
   */
  const refresh = useCallback(() => {
    fetchFAQs();
    fetchPopularFAQs();
  }, [fetchFAQs, fetchPopularFAQs]);

  // 필터나 페이지 변경 시 자동 조회
  useEffect(() => {
    fetchFAQs();
  }, [filters, pagination.page, pagination.size]);

  // 초기 로드 시 인기 FAQ 조회
  useEffect(() => {
    fetchPopularFAQs();
  }, [fetchPopularFAQs]);

  return {
    // 상태
    faqs,
    currentFaq,
    popularFaqs,
    pagination,
    filters,
    loading,
    error,

    // 조회 함수
    fetchFAQs,
    fetchFAQDetail,
    fetchPopularFAQs,
    fetchFAQsByCategory,
    searchFAQs,

    // 관리자 기능
    createFAQ,
    updateFAQ,
    deleteFAQ,
    reorderFAQ,

    // 필터/페이지 관리
    updateKeyword,
    updateCategory,
    updateFilters,
    changePage,
    changePageSize,
    changeSorting,
    resetFilters,
    resetCurrentFaq,
    refresh,
  };
};

export default useFAQ;
