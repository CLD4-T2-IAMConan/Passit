// src/components/chat/ChatRoom/index.jsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "../MessageBubble";

const ChatRoom = ({ messages }) => {
    const scrollRef = useRef(null);

    // 새로운 메시지가 오면 맨 아래로 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div
            ref={scrollRef}
            style={{
                height: "70vh",
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                background: "#fafafa",
            }}
        >
            {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
            ))}
        </div>
    );
};

export default ChatRoom;
