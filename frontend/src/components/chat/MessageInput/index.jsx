// src/components/chat/MessageInput/index.jsx
import React, { useState } from "react";

const MessageInput = ({ onSend }) => {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text);
        setText("");
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: "flex",
                gap: "8px",
                marginTop: "16px",
            }}
        >
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지를 입력하세요..."
                style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                }}
            />
            <button
                type="submit"
                style={{
                    padding: "12px 18px",
                    borderRadius: "8px",
                    background: "#4f8cff",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                전송
            </button>
        </form>
    );
};

export default MessageInput;
