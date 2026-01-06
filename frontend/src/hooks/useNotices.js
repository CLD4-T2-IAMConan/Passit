/**
 * 공지사항 관리 Hook
 */
import { useState, useCallback, useEffect } from "react";
import csService from "../services/csService";
import { handleError } from "../utils/errorHandler";
import { useLoading } from "../contexts/LoadingContext";

export const useNotices = (initialParams = {}) => {
  const [notices, setNotices] = useState([]);
  const [currentNotice, setCurrentNotice] = useState(null);
  const [importantNotices, setImportantNotices] = useState([]);
  const [pinnedNotices, setPinnedNotices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });
  const [filters, setFilters] = useState({
    keyword: "",
    categoryId: null,
    sortBy: "createdAt",
    sortDirection: "DESC",
    ...initialParams,
  });
  const [error, setError] = useState(null);
  const { loading, startLoading, stopLoading } = useLoading();

  /**
   * 공지사항 목록 조회
   */
  const fetchNotices = useCallback(
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

        const response = await csService.getNotices(searchParams);

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setNotices(content || []);
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
   * 공지사항 상세 조회
   */
  const fetchNoticeDetail = useCallback(
    async (noticeId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.getNoticeDetail(noticeId);

        if (response.success) {
          setCurrentNotice(response.data);
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
   * 중요 공지사항 조회
   */
  const fetchImportantNotices = useCallback(async () => {
    try {
      const response = await csService.getImportantNotices();

      if (response.success) {
        setImportantNotices(response.data || []);
        return { success: true, data: response.data };
      }
    } catch (err) {
      const message = handleError(err);
      console.error("Failed to fetch important notices:", message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 고정 공지사항 조회
   */
  const fetchPinnedNotices = useCallback(async () => {
    try {
      const response = await csService.getPinnedNotices();

      if (response.success) {
        setPinnedNotices(response.data || []);
        return { success: true, data: response.data };
      }
    } catch (err) {
      const message = handleError(err);
      console.error("Failed to fetch pinned notices:", message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * 카테고리별 공지사항 조회
   */
  const fetchNoticesByCategory = useCallback(
    async (categoryId, params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.getNoticesByCategory(categoryId, {
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setNotices(content || []);
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
   * 공지사항 검색
   */
  const searchNotices = useCallback(
    async (keyword, params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.searchNotices(keyword, {
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setNotices(content || []);
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
   * 공지사항 생성 (관리자)
   */
  const createNotice = useCallback(
    async (noticeData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.createNotice(noticeData);

        if (response.success) {
          setCurrentNotice(response.data);
          // 목록 새로고침
          await fetchNotices();
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
    [fetchNotices, startLoading, stopLoading]
  );

  /**
   * 공지사항 수정 (관리자)
   */
  const updateNotice = useCallback(
    async (noticeId, noticeData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.updateNotice(noticeId, noticeData);

        if (response.success) {
          setCurrentNotice(response.data);
          // 목록 새로고침
          await fetchNotices();
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
    [fetchNotices, startLoading, stopLoading]
  );

  /**
   * 공지사항 삭제 (관리자)
   */
  const deleteNotice = useCallback(
    async (noticeId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.deleteNotice(noticeId);

        if (response.success) {
          setCurrentNotice(null);
          setNotices((prev) => prev.filter((notice) => notice.id !== noticeId));
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
  const changeSorting = useCallback((sortBy, sortDirection = "DESC") => {
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
      sortBy: "createdAt",
      sortDirection: "DESC",
    });
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 현재 공지 초기화
   */
  const resetCurrentNotice = useCallback(() => {
    setCurrentNotice(null);
  }, []);

  /**
   * 새로고침
   */
  const refresh = useCallback(() => {
    fetchNotices();
    fetchImportantNotices();
    fetchPinnedNotices();
  }, [fetchNotices, fetchImportantNotices, fetchPinnedNotices]);

  // 필터나 페이지 변경 시 자동 조회
  useEffect(() => {
    fetchNotices();
  }, [filters, pagination.page, pagination.size]);

  // 초기 로드 시 중요/고정 공지 조회
  useEffect(() => {
    fetchImportantNotices();
    fetchPinnedNotices();
  }, [fetchImportantNotices, fetchPinnedNotices]);

  return {
    // 상태
    notices,
    currentNotice,
    importantNotices,
    pinnedNotices,
    pagination,
    filters,
    loading,
    error,

    // 조회 함수
    fetchNotices,
    fetchNoticeDetail,
    fetchImportantNotices,
    fetchPinnedNotices,
    fetchNoticesByCategory,
    searchNotices,

    // 관리자 기능
    createNotice,
    updateNotice,
    deleteNotice,

    // 필터/페이지 관리
    updateKeyword,
    updateCategory,
    updateFilters,
    changePage,
    changePageSize,
    changeSorting,
    resetFilters,
    resetCurrentNotice,
    refresh,
  };
};

export default useNotices;
