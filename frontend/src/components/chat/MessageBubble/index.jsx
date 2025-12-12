// src/components/chat/MessageBubble/index.jsx
import React from "react";
import "./style.css";

const MessageBubble = ({ message }) => {
    const isMine = message.sender === "ME"; // 임시 구분

    return (
        <div className={`bubble-wrapper ${isMine ? "mine" : "other"}`}>
            <div className={`bubble ${isMine ? "mine" : "other"}`}>
                {message.message}
            </div>
        </div>
    );
};

export default MessageBubble;
