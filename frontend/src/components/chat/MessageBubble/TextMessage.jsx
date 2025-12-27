import React from "react";
import "./style.css";

const formatTime = (sentAt) => {
    if (!sentAt) return "";
    const date = new Date(sentAt + "Z");
    return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const TextMessage = ({ message, isMine }) => {
    return (
        <div className={`bubble-wrapper ${isMine ? "mine" : "other"}`}>
            <div className={`bubble ${isMine ? "mine" : "other"}`}>
                {message.content}
            </div>
            <div className="message-time">
                {formatTime(message.sentAt)}
            </div>
        </div>
    );
};

export default TextMessage;
