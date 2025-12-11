// src/components/chat/ChatRoomItem/index.jsx
import React from "react";

const ChatRoomItem = ({ room, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                padding: "14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
            }}
        >
            <div style={{ fontWeight: "bold" }}>{room.title || `채팅방 #${room.id}`}</div>
            <div style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>
                마지막 메시지: {room.lastMessage || "메시지가 없습니다"}
            </div>
        </div>
    );
};

export default ChatRoomItem;
