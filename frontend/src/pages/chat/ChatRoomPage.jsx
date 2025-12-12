import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import ChatRoom from "../../components/chat/ChatRoom";
import MessageInput from "../../components/chat/MessageInput";
import useChatWebSocket from "../../hooks/chat/useChatWebSocket";
import { getMessages } from "../../api/services/chat/chat.api";

const ChatRoomPage = () => {
    const location = useLocation();
    const { chatroomId } = useParams();
    const [messages, setMessages] = useState([]);
    const isNewRoom = location.state?.isNewRoom === true;

    // WebSocket Hook
    const { sendMessage, connect, disconnect, stompClient } = useChatWebSocket({
        chatroomId,
        onMessage: (msg) => setMessages((prev) => [...prev, msg]),
    });

     // 기존 채팅방이면 메시지 불러오기
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatroomId) return;
            try {
                console.log('메시지 불러와보기')
                const data = await getMessages(chatroomId);
                setMessages(data);
            } catch (e) {
                console.error("메시지 불러오기 실패", e);
            }
        };
        fetchMessages();
    }, [chatroomId]);

    // WebSocket 연결 + 새 방이면 시스템 메시지 요청
    useEffect(() => {
        if (!chatroomId) return;
        connect({
            onConnect: () => {
                console.log("📡 WebSocket 연결됨!");
                // 최초 생성된 채팅방이면 system 메시지 전송
                if (isNewRoom) {
                    stompClient.current.send(
                        `/app/chat/${chatroomId}/system`,
                        {},
                        JSON.stringify({ type: "TRANSFER_REQUEST" })
                    );
                    console.log("🚀 새 채팅방: 시스템 메시지 요청 보냄");
                }
            },
        });

        return () => disconnect();
    }, [chatroomId, isNewRoom]);

    // 메시지 전송
    const handleSend = (text) => {
        if (!text.trim()) return;
        sendMessage({
            roomId: Number(chatroomId),
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
