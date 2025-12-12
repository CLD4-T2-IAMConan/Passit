import { axiosInstance } from "../../axiosInstance";

// 채팅방 목록 조회 // 완료
export const getChatRooms = async (userId) => {
    const res = await axiosInstance.get(`/chat/rooms`, {
        params: { userId },
    });
    console.log("📌 채팅방 목록 조회 성공:", res.data);
    return res.data; // success, data, error 그대로
};

// 채팅방 생성 // 완료
export const createChatRoom = async ({ ticketId, buyerId }) => {
    const body = { ticketId, buyerId };
    const res = await axiosInstance.post("/chat/rooms", body);
    if (!res.data.success) { // res.data = { success, data, error }
        throw new Error(res.data.error || "채팅방 생성 실패");
    }
    return res.data.data;
};

// 과거 메시지 조회 // 완료
export const getMessages = async (chatroomId) => {
    console.log('여기는 들어오니?')
    const res = await axiosInstance.get(`chat/rooms/${chatroomId}/messages`, {
    });
    console.log('여기는?', res.data.data)
    return res.data;
};

/** 특정 채팅방 기본 정보 조회 */
export const getChatRoomDetail = async (roomId) => {
    const res = await axiosInstance.get(`/rooms/${roomId}`);
    return res.data;
};
