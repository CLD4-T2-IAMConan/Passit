import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * 로딩 스피너 컴포넌트
 */
export const LoadingSpinner = ({ message, size = 40, fullPage = false }) => {
  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={size} aria-label="로딩 중" />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100%",
        }}
        role="status"
        aria-live="polite"
      >
        {content}
      </Box>
    );
  }

  return content;
};
