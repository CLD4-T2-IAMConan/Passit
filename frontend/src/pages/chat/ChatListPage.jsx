// src/pages/chat/ChatListPage.jsx
import React, { useEffect, useState } from "react";
import ChatRoomList from "../../components/chat/ChatRoomList";
import { getChatRooms } from "../../api/services/chat/chat.api";

const ChatListPage = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadChatRooms = async () => {
        try {
            setLoading(true);
            const data = await getChatRooms();
            setRooms(data);
        } catch (err) {
            console.error("채팅방 목록 조회 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChatRooms();
    }, []);

    const handleSelectRoom = (roomId) => {
        window.location.href = `/chat/${roomId}`; // 라우팅 방식에 따라 변경 가능
    };

    return (
        <div style={{ padding: "24px" }}>
            <h2>채팅 목록</h2>

            {loading ? (
                <div>로딩 중...</div>
            ) : (
                <ChatRoomList rooms={rooms} onSelectRoom={handleSelectRoom} />
            )}
        </div>
    );
};

export default ChatListPage;
