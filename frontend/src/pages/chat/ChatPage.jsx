import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Alert,
  Badge,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Chat as ChatIcon,
  ConfirmationNumber as TicketIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { getChatRooms, getMessages, markAllMessagesAsRead } from "../../api/services/chat/chat.api";
import { useAuth } from "../../contexts/AuthContext";
import ChatRoom from "../../components/chat/ChatRoom";
import MessageInput from "../../components/chat/MessageInput";
import useChatWebSocket from "../../hooks/chat/useChatWebSocket";
import IconButton from "@mui/material/IconButton";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Paper from "@mui/material/Paper";

const ChatPage = () => {
  const { chatroomId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = user?.userId || user?.id;

  // loadChatRooms를 useRef로 안정화
  const loadChatRoomsRef = useRef(null);

  // 채팅방 목록 조회
  const loadChatRooms = useCallback(async () => {
    console.log("🔵 loadChatRooms 호출됨", { currentUserId, isAuthenticated });

    if (!currentUserId) {
      console.log("⚠️ userId 없음 - 로딩 중단");
      setError("로그인이 필요합니다.");
      setLoadingRooms(false);
      return;
    }

    try {
      console.log("📤 API 호출 시작: getChatRooms");
      setLoadingRooms(true);
      setError(null);
      const response = await getChatRooms(currentUserId);
      console.log("✅ API 응답 받음:", response);
      setRooms(response.data || []);
    } catch (err) {
      console.error("❌ 채팅방 목록 조회 실패:", err);
      setError("채팅방 목록을 불러오는데 실패했습니다.");
    } finally {
      console.log("🏁 loadChatRooms 완료 - loading false");
      setLoadingRooms(false);
    }
  }, [currentUserId, isAuthenticated]);

  // loadChatRooms ref 업데이트
  useEffect(() => {
    loadChatRoomsRef.current = loadChatRooms;
  }, [loadChatRooms]);

  // 채팅방 메시지 조회
  const loadMessages = useCallback(
    async (roomId) => {
      if (!roomId || !currentUserId) {
        setLoadingMessages(false);
        return;
      }

      try {
        setLoadingMessages(true);
        const res = await getMessages(roomId);
        setMessages(Array.isArray(res.data) ? res.data : []);
        console.log("💬 기존 메시지 불러오기:", res.data);

        // 메시지 읽음 처리
        try {
          await markAllMessagesAsRead(roomId, currentUserId);
          console.log("✅ 메시지 읽음 처리 완료");
        } catch (e) {
          console.error("읽음 처리 실패:", e);
        }
      } catch (e) {
        console.error("메시지 불러오기 실패", e);
        setError("메시지를 불러오는데 실패했습니다.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  // WebSocket 연결
  const { sendMessage, connect, disconnect } = useChatWebSocket({
    chatroomId: selectedRoom?.chatroomId,
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

  // 초기 채팅방 목록 로드
  useEffect(() => {
    console.log("🔄 useEffect 실행됨", { isAuthenticated, currentUserId });
    if (isAuthenticated && currentUserId) {
      console.log("✅ 조건 만족 - loadChatRooms 호출");
      loadChatRooms();
    } else {
      console.log("⚠️ 조건 불만족 - loading false");
      setLoadingRooms(false);
      if (!isAuthenticated) {
        setError(null);
      }
    }
  }, [currentUserId, isAuthenticated, loadChatRooms]);

  // URL 파라미터로 채팅방 선택
  useEffect(() => {
    if (chatroomId && rooms.length > 0) {
      const room = rooms.find((r) => r.chatroomId === Number(chatroomId));
      if (room) {
        setSelectedRoom(room);
        loadMessages(room.chatroomId);
      }
    } else if (!chatroomId) {
      setSelectedRoom(null);
      setMessages([]);
    }
  }, [chatroomId, rooms, loadMessages]);

  // WebSocket 연결 관리
  useEffect(() => {
    if (!selectedRoom?.chatroomId) return;

    console.log("📡 WebSocket 연결 시도 중...", { chatroomId: selectedRoom.chatroomId });
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
  }, [selectedRoom?.chatroomId, connect, disconnect]);

  // 페이지 포커스 시 채팅 목록 새로고침
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && currentUserId && loadChatRoomsRef.current) {
        loadChatRoomsRef.current();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && currentUserId && loadChatRoomsRef.current) {
        loadChatRoomsRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, currentUserId]);

  // 채팅방 선택 핸들러
  const handleSelectRoom = (room) => {
    navigate(`/chat/${room.chatroomId}`);
  };

  // 메시지 전송 핸들러
  const handleSend = (text) => {
    if (!text.trim() || !selectedRoom) return;
    const newMessage = {
      chatroomId: Number(selectedRoom.chatroomId),
      senderId: currentUserId,
      type: "TEXT",
      content: text,
    };
    console.log("🚀 handleSend 호출 - 메시지 전송 시작:", text);
    sendMessage(newMessage);
    console.log("✅ sendMessage 호출 완료");
  };

  // 시간 포맷팅
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

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center", mt: "64px" }}>
        <Alert severity="warning">로그인이 필요합니다.</Alert>
      </Box>
    );
  }

  // 채팅 목록 렌더링
  const renderChatList = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "white" }}>
      {/* 헤더 */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 2,
          py: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          채팅
        </Typography>
      </Box>

      {/* 목록 */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loadingRooms ? (
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
          <List sx={{ p: 0 }}>
            {rooms.map((room, index) => (
              <React.Fragment key={room.chatroomId}>
                <ListItem
                  button
                  selected={selectedRoom?.chatroomId === room.chatroomId}
                  onClick={() => handleSelectRoom(room)}
                  sx={{
                    px: 2,
                    py: 2,
                    "&:hover": {
                      bgcolor: "grey.50",
                    },
                    "&.Mui-selected": {
                      bgcolor: "primary.light",
                      "&:hover": {
                        bgcolor: "primary.light",
                      },
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

  // 채팅방 렌더링
  const renderChatRoom = () => {
    if (!selectedRoom) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            bgcolor: "grey.50",
          }}
        >
          <ChatIcon sx={{ fontSize: 100, color: "grey.300", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            채팅방을 선택해주세요
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "white" }}>
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
            {isMobile && (
              <IconButton edge="start" onClick={() => navigate("/chat")} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
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
                {selectedRoom.ticketTitle || "채팅방"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                판매자
              </Typography>
            </Box>
            <IconButton>
              <MoreVertIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* 메시지 영역 */}
        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loadingMessages && messages.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : (
            <ChatRoom messages={messages} currentUserId={currentUserId} chatroomId={selectedRoom.chatroomId} />
          )}
        </Box>

        {/* 메시지 입력 */}
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

  // 모바일: 채팅방 선택 시 채팅방만, 선택 안 하면 목록만
  if (isMobile) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "grey.50", mt: "64px" }}>
        {selectedRoom ? renderChatRoom() : renderChatList()}
      </Box>
    );
  }

  // 데스크톱: 채팅 목록과 채팅방을 나란히 표시
  return (
    <Box sx={{ height: "100vh", display: "flex", bgcolor: "grey.50", mt: "64px" }}>
      {/* 왼쪽: 채팅 목록 */}
      <Box
        sx={{
          width: "360px",
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
        }}
      >
        {renderChatList()}
      </Box>

      {/* 오른쪽: 채팅방 */}
      <Box sx={{ flex: 1 }}>{renderChatRoom()}</Box>
    </Box>
  );
};

export default ChatPage;
