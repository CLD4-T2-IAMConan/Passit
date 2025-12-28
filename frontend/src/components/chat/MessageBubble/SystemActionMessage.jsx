import React from "react";
import "./style.css";
import { sendSystemAction } from "../../../api/services/chatService";

const SystemActionMessage = ({ message, chatroomId, currentUserId }) => {

    const handleActionClick = async (actionCode) => {
        try {
            await sendSystemAction({
                chatroomId,
                actionCode,
                userId: currentUserId,
            });
        } catch (e) {
            console.error("시스템 액션 실패", e);
        }
    };

    return (
        <div className="system-action-box">
            <div className="system-action-text">{message.content}</div>

            {message.metadata?.actions?.map((action, index) => (
                <button
                    key={index}
                    className={`action-btn ${action.isPrimary ? "primary" : ""}`}
                    onClick={() => handleActionClick(action.actionCode)}
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export default SystemActionMessage;
