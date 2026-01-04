import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import MessageBubble from "../MessageBubble";

const ChatRoom = ({ messages, currentUserId, chatroomId, roomInfo }) => {
  const scrollRef = useRef(null);

  // 새로운 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 날짜 구분선 표시 여부 확인
  const shouldShowDateDivider = (currentMsg, prevMsg) => {
    if (!currentMsg?.sentAt) return false;
    if (!prevMsg?.sentAt) return true;

    const currentDate = new Date(currentMsg.sentAt);
    const prevDate = new Date(prevMsg.sentAt);

    // 날짜만 비교 (시간 제외)
    return (
      currentDate.getFullYear() !== prevDate.getFullYear() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getDate() !== prevDate.getDate()
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        p: 2,
        bgcolor: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {messages.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            color: "text.secondary",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            메시지를 입력하여 대화를 시작해보세요
          </Typography>
        </Box>
      ) : (
        messages
          .filter((msg) => msg.sentAt || msg.tempId) // sentAt이 있거나 임시 메시지인 경우만 표시
          .map((msg, idx, filteredMessages) => {
            const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
            return (
              <React.Fragment key={msg.messageId || msg.tempId || idx}>
                {/* 날짜 구분선 */}
                {shouldShowDateDivider(msg, prevMsg) && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      my: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: "rgba(0,0,0,0.6)",
                        color: "white",
                        px: 2,
                        py: 0.5,
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {formatDate(msg.sentAt)}
                    </Typography>
                  </Box>
                )}
                <MessageBubble
                  message={msg}
                  userId={currentUserId}
                  chatroomId={chatroomId}
                  roomInfo={roomInfo}
                />
              </React.Fragment>
            );
          })
      )}
    </Box>
  );
};

export default ChatRoom;
