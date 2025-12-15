// src/components/chat/ChatRoomList/index.jsx
import React from "react";
import ChatRoomItem from "../ChatRoomItem";
import "./style.css";

const ChatRoomList = ({ rooms, onSelectRoom, onDeleteRoom }) => {
    if (!rooms || rooms.length === 0) {
        return <div className="chatroom-list-empty">참여 중인 채팅방이 없습니다.</div>;
    }

    return (
        <div className="chatroom-list">
            {rooms.map((room) => (
                <ChatRoomItem
                    key={room.chatroomId}
                    room={room}
                    onClick={() => onSelectRoom(room.chatroomId)}
                    onDelete={() => onDeleteRoom(room.chatroomId)}
                />
            ))}
        </div>
    );
};

export default ChatRoomList;
