// src/components/chat/ChatRoomList/index.jsx
import React from "react";
import ChatRoomItem from "../ChatRoomItem";

const ChatRoomList = ({ rooms, onSelectRoom }) => {
    if (!rooms || rooms.length === 0) {
        return <div>참여 중인 채팅방이 없습니다.</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rooms.map((room) => (
                <ChatRoomItem
                    key={room.id}
                    room={room}
                    onClick={() => onSelectRoom(room.id)}
                />
            ))}
        </div>
    );
};

export default ChatRoomList;
