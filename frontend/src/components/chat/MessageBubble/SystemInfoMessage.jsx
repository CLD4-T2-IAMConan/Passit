import React from "react";
import "./style.css";

const SystemInfoMessage = ({ message }) => {
    return (
        <div className="system-info-message">
            {message.content}
        </div>
    );
};

export default SystemInfoMessage;
