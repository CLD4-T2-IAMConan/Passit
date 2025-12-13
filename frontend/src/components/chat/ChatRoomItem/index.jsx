// src/components/chat/ChatRoomItem/index.jsx
import React from "react";
import "./style.css";

const ChatRoomItem = ({ room, onClick }) => {
    return (
        <div className="chatroom-item" onClick={onClick}>
            <div className="chatroom-item-title">
                {room.title || `채팅방 #${room.chatroomId} (${room.roomStatus})`}
            </div>
            <div className="chatroom-item-last">
                거래 티켓 ID: {room.ticketId}
                {/* 마지막 메시지 ID: {room.lastMessageId || "메시지가 없습니다"} */}
            </div>
        </div>
    );
};

export default ChatRoomItem;
