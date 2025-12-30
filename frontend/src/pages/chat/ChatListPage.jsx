import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Badge,
  Divider,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ConfirmationNumber as TicketIcon,
} from "@mui/icons-material";
import { getChatRooms, deleteChatRoom } from "../../api/services/chat/chat.api";
import { useAuth } from "../../contexts/AuthContext";

const ChatListPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const userId = user?.userId || user?.id;

  // 채팅방 목록 조회
  const loadChatRooms = useCallback(async () => {
    console.log("🔵 loadChatRooms 호출됨", { userId, isAuthenticated });

    if (!userId) {
      console.log("⚠️ userId 없음 - 로딩 중단");
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      console.log("📤 API 호출 시작: getChatRooms");
      setLoading(true);
      setError(null);
      const response = await getChatRooms(userId);
      console.log("✅ API 응답 받음:", response);
      setRooms(response.data || []);
    } catch (err) {
      console.error("❌ 채팅방 목록 조회 실패:", err);
      setError("채팅방 목록을 불러오는데 실패했습니다.");
    } finally {
      console.log("🏁 loadChatRooms 완료 - loading false");
      setLoading(false);
    }
  }, [userId, isAuthenticated]);

  // 채팅방 삭제
  const handleDeleteRoom = async (chatroomId, e) => {
    e.stopPropagation(); // 리스트 아이템 클릭 이벤트 방지
    const confirmed = window.confirm("채팅방을 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await deleteChatRoom(chatroomId, userId);
      setRooms((prev) => prev.filter((room) => room.chatroomId !== chatroomId));
    } catch (e) {
      console.error("채팅방 삭제 실패", e);
      alert("채팅방 삭제에 실패했습니다.");
    }
  };

  // 채팅방 선택
  const handleSelectRoom = (chatroomId) => {
    navigate(`/chat/${chatroomId}`, { replace: true });
  };

  useEffect(() => {
    console.log("🔄 useEffect 실행됨", { isAuthenticated, userId });
    if (isAuthenticated && userId) {
      console.log("✅ 조건 만족 - loadChatRooms 호출");
      loadChatRooms();
    } else {
      console.log("⚠️ 조건 불만족 - loading false");
      setLoading(false);
      if (!isAuthenticated) {
        setError(null);
      }
    }
  }, [userId, isAuthenticated, loadChatRooms]);

  // 페이지 포커스 시 채팅 목록 새로고침 (읽음 상태 반영)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && userId) {
        loadChatRooms();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && userId) {
        loadChatRooms();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, userId, loadChatRooms]);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">로그인이 필요합니다.</Alert>
      </Container>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else if (days === 1) {
      return "어제";
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      });
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "grey.50" }}>
      {/* 헤더 */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 2,
          py: 2,
          mt: "64px",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          채팅
        </Typography>
      </Box>

      {/* 채팅 목록 */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : rooms.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              px: 3,
            }}
          >
            <ChatIcon sx={{ fontSize: 80, color: "grey.300", mb: 2 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              채팅 내역이 없어요
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              티켓 상세 페이지에서 채팅하기를 눌러
              <br />
              대화를 시작해보세요
            </Typography>
          </Box>
        ) : (
          <List sx={{ bgcolor: "white", p: 0 }}>
            {rooms.map((room, index) => (
              <React.Fragment key={room.chatroomId}>
                <ListItem
                  button
                  onClick={() => handleSelectRoom(room.chatroomId)}
                  sx={{
                    px: 2,
                    py: 2,
                    "&:hover": {
                      bgcolor: "grey.50",
                    },
                    "&:active": {
                      bgcolor: "grey.100",
                    },
                  }}
                  secondaryAction={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        {formatTime(room.lastMessageTime)}
                      </Typography>
                      {room.unreadCount > 0 && (
                        <Badge
                          badgeContent={room.unreadCount}
                          color="error"
                          sx={{
                            "& .MuiBadge-badge": {
                              position: "static",
                              transform: "none",
                              minWidth: 20,
                              height: 20,
                              borderRadius: "10px",
                              fontSize: "0.7rem",
                            },
                          }}
                        />
                      )}
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: "grey.200",
                        width: 50,
                        height: 50,
                        color: "primary.main",
                      }}
                    >
                      <TicketIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ pr: 8 }}
                    primary={
                      <Typography
                        variant="subtitle1"
                        fontWeight={room.unreadCount > 0 ? 700 : 600}
                        sx={{
                          mb: 0.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {room.ticketTitle || "티켓 채팅"}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: room.unreadCount > 0 ? 500 : 400,
                        }}
                      >
                        {room.lastMessageType === "SYSTEM_ACTION_MESSAGE" ||
                        room.lastMessageType === "SYSTEM_INFO_MESSAGE"
                          ? "[시스템 메시지]"
                          : room.lastMessageContent || "메시지를 시작해보세요"}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < rooms.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ChatListPage;
