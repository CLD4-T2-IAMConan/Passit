import React from "react";
import "./style.css";

const TextMessage = ({ message, isMine }) => {
  return (
    <div className={`bubble-wrapper ${isMine ? "mine" : "other"}`}>
      <div className={`bubble ${isMine ? "mine" : "other"}`}>{message.content}</div>
    </div>
  );
};

export default TextMessage;
