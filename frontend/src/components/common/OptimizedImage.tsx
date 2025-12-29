import React, { useState } from "react";
import { Box, Skeleton, BoxProps } from "@mui/material";

interface OptimizedImageProps extends Omit<BoxProps, 'component'> {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  loading?: "lazy" | "eager";
  priority?: boolean;
}

/**
 * 최적화된 이미지 컴포넌트
 * - Lazy loading 지원
 * - 로딩 스켈레톤 표시
 * - 이미지 로드 실패 처리
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = "100%",
  height = "auto",
  objectFit = "cover",
  loading = "lazy",
  priority = false,
  sx,
  ...boxProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Box
      {...boxProps}
      sx={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        ...sx,
      }}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ position: "absolute", top: 0, left: 0 }}
          aria-label="이미지 로딩 중"
        />
      )}

      {!hasError ? (
        <Box
          component="img"
          src={src}
          alt={alt}
          loading={priority ? "eager" : loading}
          onLoad={handleLoad}
          onError={handleError}
          sx={{
            width: "100%",
            height: "100%",
            objectFit,
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.100",
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
          role="img"
          aria-label={`${alt} - 이미지 로드 실패`}
        >
          이미지를 불러올 수 없습니다
        </Box>
      )}
    </Box>
  );
};
