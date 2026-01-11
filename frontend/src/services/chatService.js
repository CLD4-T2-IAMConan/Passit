/**
 * 채팅 관리 API 서비스
 * Chat Service (8084)와 통신
 */
import { chatAPI } from "../lib/api/client";
import { ENDPOINTS } from "../api/endpoints";
import { API_SERVICES } from "../config/apiConfig";
import tokenManager from "../lib/auth/tokenManager";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

class ChatService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  // ============================================
  // 채팅방 관리
  // ============================================

  /**
   * 채팅방 생성 (거래 시작 시 자동 생성)
   * @param {Object} roomData - { ticketId, dealId, participantIds }
   * @returns {Promise}
   */
  async createChatRoom(roomData) {
    const response = await chatAPI.post(ENDPOINTS.CHAT.CREATE_ROOM, roomData);
    return response.data;
  }

  /**
   * 내 채팅방 목록 조회
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getMyChatRooms(params = {}) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.MY_ROOMS, { params });
    return response.data;
  }

  /**
   * 채팅방 상세 조회
   * @param {number} roomId
   * @returns {Promise}
   */
  async getChatRoomDetail(roomId) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.ROOM_DETAIL(roomId));
    return response.data;
  }

  /**
   * 거래별 채팅방 조회
   * @param {number} dealId
   * @returns {Promise}
   */
  async getChatRoomByDeal(dealId) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.ROOM_BY_DEAL(dealId));
    return response.data;
  }

  /**
   * 채팅방 나가기
   * @param {number} roomId
   * @returns {Promise}
   */
  async leaveChatRoom(roomId) {
    const response = await chatAPI.delete(ENDPOINTS.CHAT.LEAVE_ROOM(roomId));
    return response.data;
  }

  // ============================================
  // 메시지 관리 (REST API)
  // ============================================

  /**
   * 채팅방 메시지 목록 조회
   * @param {number} roomId
   * @param {Object} params - { page, size, beforeMessageId }
   * @returns {Promise}
   */
  async getMessages(roomId, params = {}) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.MESSAGES(roomId), { params });
    return response.data;
  }

  /**
   * 메시지 전송 (REST API - WebSocket 사용 권장)
   * @param {number} roomId
   * @param {Object} messageData - { content, messageType, metadata }
   * @returns {Promise}
   */
  async sendMessage(roomId, messageData) {
    const response = await chatAPI.post(ENDPOINTS.CHAT.SEND_MESSAGE(roomId), messageData);
    return response.data;
  }

  /**
   * 메시지 읽음 처리
   * @param {number} roomId
   * @param {number} messageId
   * @returns {Promise}
   */
  async markMessageAsRead(roomId, messageId) {
    const response = await chatAPI.post(ENDPOINTS.CHAT.MARK_AS_READ(roomId, messageId));
    return response.data;
  }

  /**
   * 채팅방 전체 메시지 읽음 처리
   * @param {number} roomId
   * @returns {Promise}
   */
  async markAllMessagesAsRead(roomId) {
    const response = await chatAPI.post(ENDPOINTS.CHAT.MARK_ALL_AS_READ(roomId));
    return response.data;
  }

  /**
   * 안읽은 메시지 개수 조회
   * @param {number} roomId
   * @returns {Promise}
   */
  async getUnreadCount(roomId) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.UNREAD_COUNT(roomId));
    return response.data;
  }

  /**
   * 전체 안읽은 메시지 개수 조회
   * @returns {Promise}
   */
  async getTotalUnreadCount() {
    const response = await chatAPI.get(ENDPOINTS.CHAT.TOTAL_UNREAD_COUNT);
    return response.data;
  }

  /**
   * 시스템 액션 메시지 전송 (거래 요청 등)
   * @param {number} roomId
   * @param {Object} actionData - { actionType, actionData }
   * @returns {Promise}
   */
  async sendSystemAction(roomId, actionData) {
    const response = await chatAPI.post(ENDPOINTS.CHAT.SYSTEM_ACTION(roomId), actionData);
    return response.data;
  }

  // ============================================
  // WebSocket 연결 (실시간 채팅)
  // ============================================

  /**
   * WebSocket 연결
   * @param {string} accessToken - 토큰 (선택적, 없으면 tokenManager에서 가져옴)
   * @param {Function} onConnected - 연결 성공 콜백
   * @param {Function} onError - 에러 콜백
   */
  connect(accessToken = null, onConnected, onError) {
    // 토큰이 제공되지 않으면 tokenManager에서 가져오기
    const token = accessToken || tokenManager.getAccessToken();
    // CloudFront를 통한 Chat Service 접근 (WebSocket: /ws/*)
    const wsURL = `${API_SERVICES.CHAT}${ENDPOINTS.CHAT.WS_ENDPOINT}`;

    // SockJS 사용
    const socket = new SockJS(wsURL);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        console.log("[STOMP Debug]", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log("WebSocket Connected:", frame);
      this.connected = true;
      if (onConnected) {
        onConnected(frame);
      }
    };

    this.stompClient.onStompError = (frame) => {
      console.error("STOMP Error:", frame);
      this.connected = false;
      if (onError) {
        onError(frame);
      }
    };

    this.stompClient.onWebSocketClose = () => {
      console.log("WebSocket Closed");
      this.connected = false;
      this.subscriptions.clear();
    };

    this.stompClient.activate();
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.subscriptions.clear();
      this.connected = false;
    }
  }

  /**
   * 채팅방 구독 (실시간 메시지 수신)
   * @param {number} roomId
   * @param {Function} onMessage - 메시지 수신 콜백
   * @returns {string} subscriptionId
   */
  subscribeToRoom(roomId, onMessage) {
    if (!this.connected || !this.stompClient) {
      console.error("WebSocket not connected");
      return null;
    }

    const destination = `/topic/chat/${roomId}`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      try {
        const messageData = JSON.parse(message.body);
        if (onMessage) {
          onMessage(messageData);
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    });

    const subscriptionId = `room-${roomId}`;
    this.subscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  /**
   * 채팅방 구독 해제
   * @param {string} subscriptionId
   */
  unsubscribeFromRoom(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * 메시지 전송 (WebSocket)
   * @param {number} roomId
   * @param {Object} messageData - { content, messageType, metadata }
   */
  sendMessageViaWebSocket(roomId, messageData) {
    if (!this.connected || !this.stompClient) {
      console.error("WebSocket not connected");
      return;
    }

    const destination = `/app/chat/${roomId}/send`;
    this.stompClient.publish({
      destination,
      body: JSON.stringify(messageData),
    });
  }

  /**
   * 타이핑 상태 전송
   * @param {number} roomId
   * @param {boolean} isTyping
   */
  sendTypingStatus(roomId, isTyping) {
    if (!this.connected || !this.stompClient) {
      return;
    }

    const destination = `/app/chat/${roomId}/typing`;
    this.stompClient.publish({
      destination,
      body: JSON.stringify({ isTyping }),
    });
  }

  /**
   * 연결 상태 확인
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  // ============================================
  // 관리자용 API
  // ============================================

  /**
   * 전체 채팅방 조회 (관리자)
   * @param {Object} params
   * @returns {Promise}
   */
  async getAllChatRoomsAdmin(params = {}) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.ADMIN.LIST, { params });
    return response.data;
  }

  /**
   * 채팅방 강제 종료 (관리자)
   * @param {number} roomId
   * @returns {Promise}
   */
  async closeChatRoomAdmin(roomId) {
    const response = await chatAPI.delete(ENDPOINTS.CHAT.ADMIN.CLOSE_ROOM(roomId));
    return response.data;
  }

  /**
   * 메시지 삭제 (관리자)
   * @param {number} roomId
   * @param {number} messageId
   * @returns {Promise}
   */
  async deleteMessageAdmin(roomId, messageId) {
    const response = await chatAPI.delete(ENDPOINTS.CHAT.ADMIN.DELETE_MESSAGE(roomId, messageId));
    return response.data;
  }

  /**
   * 채팅 통계 조회 (관리자)
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise}
   */
  async getChatStatistics(params = {}) {
    const response = await chatAPI.get(ENDPOINTS.CHAT.ADMIN.STATISTICS, { params });
    return response.data;
  }
}

export default new ChatService();
