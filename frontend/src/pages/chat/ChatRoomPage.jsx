import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  ConfirmationNumber as TicketIcon,
} from "@mui/icons-material";
import ChatRoom from "../../components/chat/ChatRoom";
import MessageInput from "../../components/chat/MessageInput";
import useChatWebSocket from "../../hooks/chat/useChatWebSocket";
import { getMessages, markAllMessagesAsRead } from "../../api/services/chat/chat.api";
import { useAuth } from "../../contexts/AuthContext";

const ChatRoomPage = () => {
  const { chatroomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = user?.userId || user?.id;
  const isNewRoom = location.state?.isNewRoom === true;

  // WebSocket
  const { sendMessage, connect, disconnect, stompClient } = useChatWebSocket({
    chatroomId,
    onMessage: (msg) => {
      console.log("📨 WS 메시지 수신:", msg);
      setMessages((prev) => {
        const exists = prev.some((m) => m.messageId === msg.messageId);
        if (exists) {
          console.log("⚠️ 중복 메시지 무시:", msg.messageId);
          return prev;
        }
        console.log("✅ 새 메시지 추가:", msg.messageId);
        return [...prev, msg];
      });
    },
  });

  // 기존 메시지 불러오기
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatroomId || !currentUserId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getMessages(chatroomId);
        setMessages(Array.isArray(res.data) ? res.data : []);
        console.log("💬기존 메시지 불러오기:", res.data);

        // 메시지 불러온 후 읽음 처리
        try {
          await markAllMessagesAsRead(chatroomId, currentUserId);
          console.log("✅ 메시지 읽음 처리 완료");
        } catch (e) {
          console.error("읽음 처리 실패:", e);
          // 읽음 처리 실패는 치명적이지 않으므로 에러 표시 안함
        }
      } catch (e) {
        console.error("메시지 불러오기 실패", e);
        setError("메시지를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [chatroomId, currentUserId]);

  // WebSocket 연결
  useEffect(() => {
    if (!chatroomId) return;
    console.log("📡 WebSocket 연결 시도 중...", { chatroomId });
    connect({
      onConnect: () => {
        console.log("✅ WebSocket 연결 성공");
      },
      onError: (error) => {
        console.error("❌ WebSocket 연결 에러:", error);
        setError("채팅 서버 연결에 실패했습니다.");
      },
    });
    return () => {
      console.log("🔌 WebSocket 연결 해제 중...");
      disconnect();
    };
  }, [chatroomId, connect, disconnect]);

  // 일반 메시지 전송
  const handleSend = (text) => {
    if (!text.trim()) return;
    const newMessage = {
      chatroomId: Number(chatroomId),
      senderId: currentUserId,
      type: "TEXT",
      content: text,
    };
    console.log("🚀 handleSend 호출 - 메시지 전송 시작:", text);
    // 낙관적 업데이트 제거 - WebSocket 응답으로만 메시지 추가
    sendMessage(newMessage);
    console.log("✅ sendMessage 호출 완료");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        bgcolor: "white",
        mt: "64px",
      }}
    >
      {/* 헤더 */}
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: "56px !important" }}>
          <IconButton edge="start" onClick={() => navigate("/chat")} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar
            sx={{
              mr: 1.5,
              bgcolor: "grey.200",
              width: 38,
              height: 38,
              color: "primary.main",
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {location.state?.ticketTitle || "채팅방"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              {location.state?.sellerName || "판매자"}
            </Typography>
          </Box>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 티켓 정보 카드 (선택적) */}
      {location.state?.ticketInfo && (
        <Box sx={{ bgcolor: "white", borderBottom: "1px solid", borderColor: "divider" }}>
          <Paper
            elevation={0}
            sx={{
              m: 1.5,
              p: 1.5,
              bgcolor: "grey.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: "grey.200",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TicketIcon sx={{ fontSize: 32, color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {location.state.ticketInfo.eventName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                  {location.state.ticketInfo.price?.toLocaleString()}원
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* 메시지 영역 */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {loading && messages.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <ChatRoom messages={messages} currentUserId={currentUserId} chatroomId={chatroomId} />
        )}
      </Box>

      {/* 메시지 입력 영역 */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "#e0e0e0",
        }}
      >
        <MessageInput onSend={handleSend} />
      </Box>
    </Box>
  );
};

export default ChatRoomPage;
