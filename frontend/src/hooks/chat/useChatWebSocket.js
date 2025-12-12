// src/hooks/chat/useChatWebSocket.js
import { useEffect, useRef, useState } from "react";

export default function useChatWebSocket(roomId, userId) {
    const [messages, setMessages] = useState([]);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!roomId) return;

        const WS_URL = `wss://your-api.com/chat/ws?roomId=${roomId}&userId=${userId}`;
        const socket = new WebSocket(WS_URL);

        wsRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setMessages((prev) => [...prev, msg]);
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            socket.close();
        };
    }, [roomId]);

    const sendMessage = (text) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const message = {
            roomId,
            senderId: userId,
            message: text,
            type: "TALK",
        };

        wsRef.current.send(JSON.stringify(message));
    };

    return { messages, sendMessage };
}
