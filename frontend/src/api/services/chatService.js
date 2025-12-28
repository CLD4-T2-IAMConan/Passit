import { chatApiClient } from "../client";

// 채팅방 목록 조회 [완료]
export const getChatRooms = async (userId) => {
  const res = await chatApiClient.get(`/chat/rooms`, {
    params: { userId },
  });
  console.log("채팅방 목록 조회 성공:", res.data);
  return res.data;
};

// 채팅방 생성 [완료]
export const createChatRoom = async ({ ticketId, buyerId }) => {
  const body = { ticketId, buyerId };
  const res = await chatApiClient.post("/chat/rooms", body);
  if (!res.data.success) {
    throw new Error(res.data.error || "채팅방 생성 실패");
  }
  return res.data.data;
};

// 과거 메시지 조회 [완료]
export const getMessages = async (chatroomId) => {
  const res = await chatApiClient.get(`/chat/rooms/${chatroomId}/messages`, {});
  return res.data;
};

// 채팅방 삭제 [완료]
export const deleteChatRoom = (chatroomId, userId) => {
  const res = chatApiClient.delete(`/chat/rooms/${chatroomId}`, {
    params: { userId },
  });
  console.log("채팅방 삭제 완료", res.data);
  return res.data;
};

/** 특정 채팅방 기본 정보 조회 */
export const getChatRoomDetail = async (roomId) => {
  const res = await chatApiClient.get(`/rooms/${roomId}`);
  return res.data;
};

// 시스템 액션 처리 (양도 요청 / 수락 / 거절)
export const sendSystemAction = async ({ chatroomId, actionCode, userId }) => {
  const body = { chatroomId, actionCode };
  const res = await chatApiClient.post(
      `/chat/rooms/system-action`,
      body,
      {
        params: { userId },
      }
  );
  return res.data;
};