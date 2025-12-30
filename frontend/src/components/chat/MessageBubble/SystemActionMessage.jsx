import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";
import { handleSystemAction } from "../../../api/services/chat/chat.api";

const SystemActionMessage = ({ message, userId, chatroomId, roomInfo }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if this message should be visible to the current user
  const visibleTarget = message.metadata?.visibleTarget;
  const buyerId = message.metadata?.buyerId;
  const sellerId = message.metadata?.sellerId || roomInfo?.sellerId;

  // visibleTarget에 따라 메시지 표시 여부 결정
  if (visibleTarget === "BUYER" && userId !== buyerId) {
    return null;
  }

  if (visibleTarget === "SELLER" && userId !== sellerId) {
    return null;
  }

  const handleActionClick = async (actionCode) => {
    try {
      setLoading(true);
      await handleSystemAction(Number(chatroomId), userId, actionCode);
      console.log("✅ 액션 처리 완료:", actionCode);

      // START_PAYMENT의 경우 결제 페이지로 리다이렉트
      if (actionCode === "START_PAYMENT" && roomInfo?.ticketId) {
        // TODO: 실제 결제 페이지로 리다이렉트 (payment_id 필요)
        // 현재는 티켓 상세 페이지로 리다이렉트
        navigate(`/tickets/${roomInfo.ticketId}/detail`);
      }
    } catch (error) {
      console.error("❌ 액션 처리 실패:", error);
      alert("요청 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: "#f0f7ff",
          borderRadius: 2.5,
          border: "1px solid #d0e7ff",
          maxWidth: "85%",
          p: 2.5,
          textAlign: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
          <InfoIcon sx={{ fontSize: 20, color: "#1976d2", mr: 0.5 }} />
          <Typography variant="body2" sx={{ color: "#1976d2", fontWeight: 600 }}>
            티켓 양도 안내
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mb: 2.5,
            color: "text.secondary",
            lineHeight: 1.6,
            fontSize: "0.9rem",
          }}
        >
          {message.content}
        </Typography>

        {message.metadata?.actions?.map((action, index) => (
          <Button
            key={index}
            variant={action.isPrimary ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleActionClick(action.actionCode)}
            disabled={loading}
            sx={{
              mr: index < message.metadata.actions.length - 1 ? 1 : 0,
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontSize: "0.9rem",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: action.isPrimary ? "0 2px 8px rgba(25, 118, 210, 0.25)" : "none",
              "&:hover": {
                boxShadow: action.isPrimary ? "0 4px 12px rgba(25, 118, 210, 0.35)" : "none",
              },
            }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default SystemActionMessage;
