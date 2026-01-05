/**
 * 로딩 상태 관리 Context
 */
import React, { createContext, useState, useContext, useCallback } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  // 로딩 시작
  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
    setLoading(true);
  }, []);

  // 로딩 종료
  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setLoading(false);
      }
      return newCount;
    });
  }, []);

  // 로딩 상태 강제 리셋
  const resetLoading = useCallback(() => {
    setLoadingCount(0);
    setLoading(false);
  }, []);

  const value = {
    loading,
    loadingCount,
    startLoading,
    stopLoading,
    resetLoading,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

// 커스텀 Hook
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};

export default LoadingContext;
