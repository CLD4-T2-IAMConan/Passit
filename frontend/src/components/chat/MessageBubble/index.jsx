import React from "react";
import TextMessage from "./TextMessage";
import SystemInfoMessage from "./SystemInfoMessage";
import SystemActionMessage from "./SystemActionMessage";

const MessageBubble = ({ message, userId }) => {
  const isMine = message.senderId === userId;

  switch (message.type) {
    case "TEXT":
      return <TextMessage message={message} isMine={isMine} />;

    case "SYSTEM_MESSAGE":
      return <SystemInfoMessage message={message} />;

    case "SYSTEM_ACTION_MESSAGE":
      return <SystemActionMessage message={message} />;

    default:
      return null; // 처리하지 않는 메시지는 표시 X
  }
};

export default MessageBubble;
