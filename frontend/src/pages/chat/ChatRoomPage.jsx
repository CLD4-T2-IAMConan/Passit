// src/pages/chat/ChatRoomPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChatRoom from "../../components/chat/ChatRoom";
import MessageInput from "../../components/chat/MessageInput";
import useChatWebSocket from "../../hooks/chat/useChatWebSocket";
import chatApi from "../../api/services/chat/chat.api";

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const [messages, setMessages] = useState([]);

    const { sendMessage, connect, disconnect } = useChatWebSocket({
        roomId,
        onMessage: (msg) => setMessages((prev) => [...prev, msg]),
    });

    // 기존 메시지 불러오기 (REST)
    useEffect(() => {
        const fetchMessages = async () => {
            const data = await chatApi.getMessages(roomId);
            setMessages(data);
        };
        fetchMessages();
    }, [roomId]);

    // WebSocket 연결
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [roomId]);

    const handleSend = (text) => {
        sendMessage({
            roomId: Number(roomId),
            message: text,
        });
    };

    return (
        <div style={{ padding: "16px" }}>
            <ChatRoom messages={messages} />
            <MessageInput onSend={handleSend} />
        </div>
    );
};

export default ChatRoomPage;
