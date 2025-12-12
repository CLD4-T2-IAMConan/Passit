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
    const { buyerId } = location.state || {};
    const userId = 1;

    // WebSocket Hook
    const { sendMessage, connect, disconnect, stompClient } = useChatWebSocket({
        chatroomId,
        onMessage: (msg) => {
            console.log("📨 WS 메시지 받음:", msg);  // 🔥 WebSocket 메시지 구조 확인
            setMessages((prev) => [...prev, msg]);
        },
    });

    // 기존 채팅방이면 메시지 불러오기
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatroomId) return;
            try {
                console.log("📥 기존 메시지 불러오기");
                const data = await getMessages(chatroomId);
                console.log("📥 불러온 메시지 목록:", data);  // 🔥 불러온 메시지 구조 확인
                setMessages(data);
            } catch (e) {
                console.error("메시지 불러오기 실패", e);
            }
        };
        fetchMessages();
    }, [chatroomId]);

    // messages가 업데이트될 때마다 콘솔로 전체 메시지 확인
    useEffect(() => {
        console.log("📩 메시지 리스트 업데이트:", messages);  // 🔥 전체 messages 구조 확인
    }, [messages]);

    // WebSocket 연결 + 새 방이면 시스템 메시지 요청
    useEffect(() => {
        if (!chatroomId) return;
        connect({
            onConnect: () => {
                console.log("📡 WebSocket 연결됨!");
                if (isNewRoom) {
                    stompClient.current.send(
                        `/app/chat/${chatroomId}/system`,
                        {},
                        JSON.stringify({
                            chatroomId: Number(chatroomId),
                            senderId: buyerId,
                            type: "REQUEST_TRANSFER_INTRO",
                        })
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
            <ChatRoom messages={messages} userId={userId} />
            <MessageInput onSend={handleSend} />
        </div>
    );
};

export default ChatRoomPage;
