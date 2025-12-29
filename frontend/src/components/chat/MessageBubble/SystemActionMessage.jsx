import React from "react";
import "./style.css";

const SystemActionMessage = ({ message }) => {
  return (
    <div className="system-action-box">
      <div className="system-action-text">{message.content}</div>

      {message.metadata?.actions?.map((action, index) => (
        <button
          key={index}
          className={`action-btn ${action.isPrimary ? "primary" : ""}`}
          onClick={() => {
            console.log("ACTION:", action.actionCode);
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default SystemActionMessage;
