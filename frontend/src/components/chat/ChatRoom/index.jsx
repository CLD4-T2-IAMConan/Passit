// src/components/chat/ChatRoom/index.jsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "../MessageBubble";
import "./style.css";

const ChatRoom = ({ messages, currentUserId }) => {
    const scrollRef = useRef(null);

    // 새로운 메시지가 오면 맨 아래로 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const canSeeMessage = (message, currentUserId) => {
        const target = message.metadata?.visibleTarget;
        // visibleTarget 없으면 모두에게 공개
        if (!target) return true;
        if (target === "BUYER") {
            return currentUserId === message.metadata?.buyerId;
        }
        if (target === "SELLER") {
            return currentUserId === message.metadata?.sellerId;
        }
        return true;
    };

    return (
        <div ref={scrollRef} className="chatroom-container">
            {messages
                .filter((msg) => canSeeMessage(msg, currentUserId))
                .map((msg) => (
                    <MessageBubble
                        key={msg.messageId}
                        message={msg}
                        userId={currentUserId}
                    />
                ))}
        </div>
    );
};

export default ChatRoom;
