import React from "react";
import "./style.css";

const SystemInfoMessage = ({ message }) => {
  return <div className="system-message">{message.content}</div>;
};

export default SystemInfoMessage;
