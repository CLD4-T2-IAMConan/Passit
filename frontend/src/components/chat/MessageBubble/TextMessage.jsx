import React from "react";
import { Box, Typography } from "@mui/material";

const TextMessage = ({ message, isMine }) => {
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 0.5,
        mb: 1.5,
        px: 1,
      }}
    >
      {/* 메시지 버블 */}
      <Box
        sx={{
          maxWidth: "70%",
          px: 1.5,
          py: 1.2,
          bgcolor: isMine ? "#1976d2" : "#f5f5f5",
          color: isMine ? "white" : "text.primary",
          borderRadius: "18px",
          borderTopLeftRadius: isMine ? "18px" : "4px",
          borderTopRightRadius: isMine ? "4px" : "18px",
          boxShadow: isMine ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            fontSize: "0.95rem",
            lineHeight: 1.5,
          }}
        >
          {message.content}
        </Typography>
      </Box>

      {/* 시간 */}
      {message.sentAt && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: "0.7rem",
            minWidth: "fit-content",
            pb: 0.3,
          }}
        >
          {formatTime(message.sentAt)}
        </Typography>
      )}
    </Box>
  );
};

export default TextMessage;
