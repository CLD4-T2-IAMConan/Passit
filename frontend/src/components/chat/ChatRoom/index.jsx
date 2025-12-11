import React, { useEffect, useRef } from "react";
import MessageBubble from "../MessageBubble";
import "./style.css";

const ChatRoom = ({ messages }) => {
    const scrollRef = useRef(null);

    // 새로운 메시지가 오면 맨 아래로 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div ref={scrollRef} className="chatroom-container">
            {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
            ))}
        </div>
    );
};

export default ChatRoom;
