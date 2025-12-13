import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import ChatRoom from "../../components/chat/ChatRoom";
import MessageInput from "../../components/chat/MessageInput";
import useChatWebSocket from "../../hooks/chat/useChatWebSocket";
import { getMessages } from "../../api/services/chat/chat.api";

const ChatRoomPage = () => {
    const { chatroomId } = useParams();
    const location = useLocation();

    const [messages, setMessages] = useState([]);

    // ⚠️ 실제로는 auth에서 가져와야 함
    const currentUserId = 99;
    const isNewRoom = location.state?.isNewRoom === true;

    // WebSocket
    const { sendMessage, connect, disconnect, stompClient } =
        useChatWebSocket({
            chatroomId,
            onMessage: (msg) => {
                console.log("📨 WS 메시지:", msg);
                setMessages((prev) => [...prev, msg]);
            },
        });

    // 기존 메시지 불러오기
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatroomId) return;
            try {
                const res = await getMessages(chatroomId);
                setMessages(Array.isArray(res.data) ? res.data : []);
                console.log('💬기존 메시지 불러오기:', res.data)
            } catch (e) {
                console.error("메시지 불러오기 실패", e);
            }
        };
        fetchMessages();
    }, [chatroomId]);

    // WebSocket 연결 + 새 방 시스템 메시지
    useEffect(() => {
        if (!chatroomId) return;

        connect({
            onConnect: () => {
                console.log("📡 WebSocket 연결됨");

                if (isNewRoom) {
                    stompClient.current.send(
                        `/app/chat/${chatroomId}/system`,
                        {},
                        JSON.stringify({
                            chatroomId: Number(chatroomId),
                            senderId: currentUserId,
                            type: "REQUEST_TRANSFER_INTRO",
                        })
                    );
                }
            },
        });

        return () => disconnect();
    }, [chatroomId, isNewRoom]);

    // 일반 메시지 전송
    const handleSend = (text) => {
        if (!text.trim()) return;

        sendMessage({
            chatroomId: Number(chatroomId),
            senderId: currentUserId,
            type: "TEXT",
            content: text,
        });
    };

    return (
        <div style={{ padding: "16px" }}>
            <ChatRoom
                messages={messages}
                currentUserId={currentUserId}
            />
            <MessageInput onSend={handleSend} />
        </div>
    );
};

export default ChatRoomPage;
