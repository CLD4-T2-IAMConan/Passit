// src/components/chat/MessageBubble/index.jsx
import React from "react";

const MessageBubble = ({ message }) => {
    const isMine = message.sender === "ME"; // 프론트 임시 구분 (수정 가능)

    return (
        <div
            style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
            }}
        >
            <div
                style={{
                    maxWidth: "70%",
                    padding: "10px 14px",
                    background: isMine ? "#4f8cff" : "#e6e6e6",
                    color: isMine ? "white" : "black",
                    borderRadius: "12px",
                    fontSize: "15px",
                    lineHeight: "1.4",
                }}
            >
                {message.message}
            </div>
        </div>
    );
};

export default MessageBubble;
