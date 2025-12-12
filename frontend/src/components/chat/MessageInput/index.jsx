// src/components/chat/MessageInput/index.jsx
import React, { useState } from "react";
import "./style.css";

const MessageInput = ({ onSend }) => {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
    };

    return (
        <form className="message-input-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="message-input-field"
            />
            <button type="submit" className="message-input-button">
                전송
            </button>
        </form>
    );
};

export default MessageInput;
