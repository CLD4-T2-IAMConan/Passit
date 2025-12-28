// src/components/chat/MessageInput/index.jsx
import React, { useState } from "react";
import "./style.css";

const MessageInput = ({ onSend, roomStatus }) => {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
    };

    const isLocked = roomStatus === "LOCK";

    return (
        <form className="message-input-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={text}
                disabled={isLocked}
                onChange={(e) => setText(e.target.value)}
                placeholder={isLocked ? "채팅이 잠겨 있습니다." : "메시지를 입력하세요"}
                className="message-input-field"
            />
            <button disabled={isLocked} type="submit" className="message-input-button">
                전송
            </button>
        </form>
    );
};

export default MessageInput;
