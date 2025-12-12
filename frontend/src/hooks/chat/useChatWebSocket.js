import { useRef } from "react";
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useChatWebSocket = ({ roomId, onMessage }) => {
    const stompClientRef = useRef(null); // STOMP 클라이언트 객체를 보관하는 참조
    
    const connect = (callbacks = {}) => {
        const socket = new SockJS("http://localhost:8084/ws");
        const client = Stomp.over(socket);
        stompClientRef.current = client;
        client.connect({}, () => {
            console.log("🟢 STOMP connected");
            // 채팅방 구독
            client.subscribe(`/topic/chatrooms/${roomId}`, (message) => {
                onMessage(JSON.parse(message.body));
            });
            // 외부에서 전달된 onConnect 있으면 호출
            if (callbacks.onConnect) callbacks.onConnect();
        });
    };

    // 연결 해제, 컴포넌트 언마운트 시 호출
    const disconnect = () => { 
        if (stompClientRef.current) {
            stompClientRef.current.disconnect();
            console.log("🔴 WebSocket disconnected");
        }
    };
    
    // 클라이언트 -> 서버
    const sendMessage = (payload) => {
        if (!stompClientRef.current) return;

        stompClientRef.current.send(
            `/app/chat/message`,
            {},
            JSON.stringify(payload)
        );
    };

    return {
        sendMessage,
        connect,
        disconnect,
        stompClient: stompClientRef, // ← 이렇게 반환해야 페이지에서 사용 가능!
    };
};

export default useChatWebSocket;
