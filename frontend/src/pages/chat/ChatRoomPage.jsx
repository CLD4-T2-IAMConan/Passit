import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ChatRoom from "../../components/chat/ChatRoom";
import MessageInput from "../../components/chat/MessageInput";
import useChatWebSocket from "../../hooks/chat/useChatWebSocket";
import { getMessages, createChatRoom } from "../../api/services/chat/chat.api";

const ChatRoomPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState([]);

    // 티켓 상세 페이지에서 받을 값
    // location.state 를 사용할 준비는 해두고 fallback 값은 임시 하드코딩
    const ticketId = location.state?.ticketId ?? 33;
    const buyerId = location.state?.buyerId ?? 101;  // 로그인 사용자
    const sellerId = location.state?.sellerId ?? 5;

    // WebSocket Hook
    const { sendMessage, connect, disconnect } = useChatWebSocket({
        roomId,
        onMessage: (msg) => setMessages((prev) => [...prev, msg]),
    });

    /** 채팅방 생성 */
    const handleCreateRoom = async () => {
        try {
            const newRoom = await createChatRoom({
                ticketId: 33,
                buyerId: 101       // 일단 하드 코딩
            });
            console.log("📌 채팅방 생성 성공:", newRoom);
            // 생성 직후 채팅방으로 이동시키기
            navigate(`/chat/rooms/${newRoom.chatroomId}`);
        } catch (e) {
            console.error("채팅방 생성 실패", e);
        }
    };

     /** 기존 채팅방이면 메시지 불러오기 */
     useEffect(() => {
         const fetchMessages = async () => {
             if (!roomId) return;
             try {
                 const data = await getMessages(roomId);
                 setMessages(data);
             } catch (e) {
                 console.error("메시지 불러오기 실패", e);
             }
         };
         fetchMessages();
     }, [roomId]);

    // WebSocket 연결
    useEffect(() => {
        if (!roomId) return;
        connect();
        return () => disconnect();
    }, [roomId]);

    /** 메시지 전송 */
    const handleSend = (text) => {
        if (!text.trim()) return;
        sendMessage({
            roomId: Number(roomId),
            message: text,
        });
    };

    return (
        <div style={{ padding: "16px" }}>
            {/* 개발용: 채팅방 수동 생성 버튼 */}
            <button onClick={handleCreateRoom} style={{ marginBottom: "12px" }}>
                채팅방 생성
            </button>
            <ChatRoom messages={messages} />
            <MessageInput onSend={handleSend} />
        </div>
    );
};

export default ChatRoomPage;
