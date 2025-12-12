// src/components/chat/ChatRoomItem/index.jsx
import React from "react";
import "./style.css";

const ChatRoomItem = ({ room, onClick }) => {
    return (
        <div className="chatroom-item" onClick={onClick}>
            <div className="chatroom-item-title">
                {room.title || `채팅방 #${room.id}`}
            </div>
            <div className="chatroom-item-last">
                마지막 메시지: {room.lastMessage || "메시지가 없습니다"}
            </div>
        </div>
    );
};

export default ChatRoomItem;
