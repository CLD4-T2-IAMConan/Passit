/**
 * 채팅 관리 Hook (WebSocket 포함)
 */
import { useState, useCallback, useEffect, useRef } from "react";
import chatService from "../services/chatService";
import { handleError } from "../utils/errorHandler";
import { useLoading } from "../contexts/LoadingContext";
import { useAuth } from "../contexts/AuthContext";

export const useChat = () => {
  const { getAccessToken } = useAuth();
  const { loading, startLoading, stopLoading } = useLoading();

  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 50,
    hasMore: true,
  });

  const subscriptionIdRef = useRef(null);

  // ============================================
  // WebSocket 연결 관리
  // ============================================

  /**
   * WebSocket 연결
   */
  const connectWebSocket = useCallback(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }

    chatService.connect(
      accessToken,
      () => {
        console.log("WebSocket 연결 성공");
        setConnected(true);
        setError(null);
      },
      (err) => {
        console.error("WebSocket 연결 실패:", err);
        setConnected(false);
        setError("채팅 서버 연결에 실패했습니다.");
      }
    );
  }, [getAccessToken]);

  /**
   * WebSocket 연결 해제
   */
  const disconnectWebSocket = useCallback(() => {
    chatService.disconnect();
    setConnected(false);
    subscriptionIdRef.current = null;
  }, []);

  // 컴포넌트 마운트 시 WebSocket 연결
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // ============================================
  // 채팅방 관리
  // ============================================

  /**
   * 채팅방 생성
   */
  const createChatRoom = useCallback(
    async (roomData) => {
      try {
        startLoading();
        setError(null);

        const response = await chatService.createChatRoom(roomData);

        if (response.success) {
          setChatRooms((prev) => [response.data, ...prev]);
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
   * 내 채팅방 목록 조회
   */
  const fetchMyChatRooms = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await chatService.getMyChatRooms(params);

        if (response.success) {
          setChatRooms(response.data?.content || response.data || []);
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
   * 채팅방 입장 (구독 시작)
   */
  const enterChatRoom = useCallback(
    async (roomId) => {
      try {
        startLoading();
        setError(null);

        // 채팅방 상세 정보 조회
        const response = await chatService.getChatRoomDetail(roomId);

        if (response.success) {
          setCurrentRoom(response.data);

          // 메시지 조회
          const messagesResponse = await chatService.getMessages(roomId, {
            page: 0,
            size: pagination.size,
          });

          if (messagesResponse.success) {
            const messageData = messagesResponse.data;
            setMessages(messageData.content || messageData || []);
            setPagination({
              page: 0,
              size: pagination.size,
              hasMore: messageData.totalPages ? messageData.page < messageData.totalPages - 1 : false,
            });
          }

          // WebSocket 구독
          if (connected) {
            // 이전 구독 해제
            if (subscriptionIdRef.current) {
              chatService.unsubscribeFromRoom(subscriptionIdRef.current);
            }

            // 새 채팅방 구독
            const subId = chatService.subscribeToRoom(roomId, (message) => {
              setMessages((prev) => [...prev, message]);
            });
            subscriptionIdRef.current = subId;
          }

          // 안읽은 메시지 읽음 처리
          await chatService.markAllMessagesAsRead(roomId);
          setUnreadCount(0);

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
    [connected, pagination.size, startLoading, stopLoading]
  );

  /**
   * 채팅방 나가기 (구독 해제)
   */
  const leaveChatRoom = useCallback(() => {
    if (subscriptionIdRef.current) {
      chatService.unsubscribeFromRoom(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }

    setCurrentRoom(null);
    setMessages([]);
    setPagination({
      page: 0,
      size: 50,
      hasMore: true,
    });
  }, []);

  /**
   * 채팅방 삭제/나가기
   */
  const deleteChatRoom = useCallback(
    async (roomId) => {
      try {
        startLoading();
        setError(null);

        const response = await chatService.leaveChatRoom(roomId);

        if (response.success) {
          setChatRooms((prev) => prev.filter((room) => room.id !== roomId));
          if (currentRoom?.id === roomId) {
            leaveChatRoom();
          }
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
    [currentRoom, leaveChatRoom, startLoading, stopLoading]
  );

  /**
   * 거래별 채팅방 조회
   */
  const fetchChatRoomByDeal = useCallback(
    async (dealId) => {
      try {
        startLoading();
        setError(null);

        const response = await chatService.getChatRoomByDeal(dealId);

        if (response.success) {
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

  // ============================================
  // 메시지 관리
  // ============================================

  /**
   * 이전 메시지 로드 (페이지네이션)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!currentRoom || !pagination.hasMore) {
      return;
    }

    try {
      const nextPage = pagination.page + 1;
      const response = await chatService.getMessages(currentRoom.id, {
        page: nextPage,
        size: pagination.size,
      });

      if (response.success) {
        const messageData = response.data;
        setMessages((prev) => [...(messageData.content || messageData || []), ...prev]);
        setPagination({
          page: nextPage,
          size: pagination.size,
          hasMore: messageData.totalPages ? nextPage < messageData.totalPages - 1 : false,
        });
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    }
  }, [currentRoom, pagination]);

  /**
   * 메시지 전송 (WebSocket)
   */
  const sendMessage = useCallback(
    (content, messageType = "TEXT", metadata = {}) => {
      if (!currentRoom) {
        setError("채팅방을 선택해주세요.");
        return;
      }

      if (!connected) {
        setError("채팅 서버에 연결되지 않았습니다.");
        return;
      }

      chatService.sendMessageViaWebSocket(currentRoom.id, {
        content,
        messageType,
        metadata,
      });
    },
    [currentRoom, connected]
  );

  /**
   * 메시지 전송 (REST API - fallback)
   */
  const sendMessageREST = useCallback(
    async (content, messageType = "TEXT", metadata = {}) => {
      if (!currentRoom) {
        setError("채팅방을 선택해주세요.");
        return { success: false, error: "채팅방을 선택해주세요." };
      }

      try {
        const response = await chatService.sendMessage(currentRoom.id, {
          content,
          messageType,
          metadata,
        });

        if (response.success) {
          setMessages((prev) => [...prev, response.data]);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentRoom]
  );

  /**
   * 시스템 액션 메시지 전송
   */
  const sendSystemAction = useCallback(
    async (actionType, actionData) => {
      if (!currentRoom) {
        setError("채팅방을 선택해주세요.");
        return { success: false, error: "채팅방을 선택해주세요." };
      }

      try {
        const response = await chatService.sendSystemAction(currentRoom.id, {
          actionType,
          actionData,
        });

        if (response.success) {
          setMessages((prev) => [...prev, response.data]);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentRoom]
  );

  /**
   * 타이핑 상태 전송
   */
  const sendTypingStatus = useCallback(
    (isTyping) => {
      if (currentRoom && connected) {
        chatService.sendTypingStatus(currentRoom.id, isTyping);
      }
    },
    [currentRoom, connected]
  );

  /**
   * 메시지 읽음 처리
   */
  const markAsRead = useCallback(
    async (messageId) => {
      if (!currentRoom) {
        return;
      }

      try {
        await chatService.markMessageAsRead(currentRoom.id, messageId);
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    },
    [currentRoom]
  );

  /**
   * 전체 메시지 읽음 처리
   */
  const markAllAsRead = useCallback(async () => {
    if (!currentRoom) {
      return;
    }

    try {
      await chatService.markAllMessagesAsRead(currentRoom.id);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all messages as read:", err);
    }
  }, [currentRoom]);

  /**
   * 안읽은 메시지 개수 조회
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!currentRoom) {
      return;
    }

    try {
      const response = await chatService.getUnreadCount(currentRoom.id);
      if (response.success) {
        setUnreadCount(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [currentRoom]);

  /**
   * 전체 안읽은 메시지 개수 조회
   */
  const fetchTotalUnreadCount = useCallback(async () => {
    try {
      const response = await chatService.getTotalUnreadCount();
      if (response.success) {
        setTotalUnreadCount(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch total unread count:", err);
    }
  }, []);

  // 주기적으로 전체 안읽은 메시지 개수 업데이트
  useEffect(() => {
    fetchTotalUnreadCount();
    const interval = setInterval(fetchTotalUnreadCount, 30000); // 30초마다

    return () => clearInterval(interval);
  }, [fetchTotalUnreadCount]);

  return {
    // 상태
    chatRooms,
    currentRoom,
    messages,
    unreadCount,
    totalUnreadCount,
    connected,
    loading,
    error,
    pagination,

    // WebSocket 관리
    connectWebSocket,
    disconnectWebSocket,

    // 채팅방 관리
    createChatRoom,
    fetchMyChatRooms,
    enterChatRoom,
    leaveChatRoom,
    deleteChatRoom,
    fetchChatRoomByDeal,

    // 메시지 관리
    loadMoreMessages,
    sendMessage,
    sendMessageREST,
    sendSystemAction,
    sendTypingStatus,
    markAsRead,
    markAllAsRead,
    fetchUnreadCount,
    fetchTotalUnreadCount,
  };
};

export default useChat;
