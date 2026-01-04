import { chatAPI } from "../../axiosInstances";

// 채팅방 목록 조회 // 완료
export const getChatRooms = async (userId) => {
  const res = await chatAPI.get(`/chat/rooms`, {
    params: { userId },
  });
  console.log("📌 채팅방 목록 조회 성공:", res.data);
  return res.data; // success, data, error 그대로
};

// 채팅방 생성 // 완료
export const createChatRoom = async ({ ticketId, buyerId }) => {
  const body = { ticketId, buyerId };
  const res = await chatAPI.post("/chat/rooms", body);
  if (!res.data.success) {
    // res.data = { success, data, error }
    throw new Error(res.data.error || "채팅방 생성 실패");
  }
  return res.data.data;
};

// 과거 메시지 조회 // 완료
export const getMessages = async (chatroomId) => {
  console.log("여기는 들어오니?");
  const res = await chatAPI.get(`/chat/rooms/${chatroomId}/messages`, {});
  console.log("여기는?", res.data.data);
  return res.data;
};

// 채팅방 삭제 // 완료
export const deleteChatRoom = async (chatroomId, userId) => {
  const res = await chatAPI.delete(`/chat/rooms/${chatroomId}`, {
    params: { userId },
  });
  console.log("채팅방 삭제 완료", res.data);
  return res.data;
};

/** 특정 채팅방 기본 정보 조회 */
export const getChatRoomDetail = async (roomId) => {
  const res = await chatAPI.get(`/chat/rooms/${roomId}`);
  return res.data;
};

/** 채팅방 입장 시 모든 메시지 읽음 처리 */
export const markAllMessagesAsRead = async (chatroomId, userId) => {
  const res = await chatAPI.put(`/chat/rooms/${chatroomId}/read-all`, null, {
    params: { userId },
  });
  return res.data;
};

/** 시스템 액션 처리 (양도 요청, 수락, 거절 등) */
export const handleSystemAction = async (chatroomId, userId, actionCode) => {
  try {
    const res = await chatAPI.post(
      `/chat/rooms/system-action`,
      { chatroomId, actionCode },
      { params: { userId } }
    );
    if (!res.data.success) {
      throw new Error(res.data.error || "요청 처리에 실패했습니다.");
    }
    return res.data;
  } catch (error) {
    console.error("❌ 시스템 액션 처리 실패:", error);
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "요청 처리에 실패했습니다. 다시 시도해주세요.";
    throw new Error(errorMessage);
  }
};
