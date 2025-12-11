// src/api/services/chat/chat.api.js
import axios from "axios";

const API_BASE = "https://your-api.com/chat"; // 실제 API Gateway URL로 변경 필요

/** 채팅방 목록 조회 */
export const getChatRooms = async () => {
    const res = await axios.get(`${API_BASE}/rooms`);
    return res.data;
};

/** 특정 채팅방 기본 정보 조회 */
export const getChatRoomDetail = async (roomId) => {
    const res = await axios.get(`${API_BASE}/rooms/${roomId}`);
    return res.data;
};

/** 과거 메시지 조회 */
export const getMessages = async (roomId, page = 0) => {
    const res = await axios.get(`${API_BASE}/rooms/${roomId}/messages?page=${page}`);
    return res.data;
};
