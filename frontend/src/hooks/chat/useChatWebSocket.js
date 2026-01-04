import { useRef, useCallback, useEffect } from "react";
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useChatWebSocket = ({ chatroomId, onMessage }) => {
  const stompClientRef = useRef(null); // STOMP 클라이언트 객체를 보관하는 참조
  const subscriptionRef = useRef(null); // 구독 객체 저장
  const onMessageRef = useRef(onMessage); // onMessage를 ref로 저장하여 안정적인 참조 유지

  // onMessage가 변경되면 ref 업데이트
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(
    (callbacks = {}) => {
      // 이미 연결되어 있으면 무시
      if (stompClientRef.current && stompClientRef.current.connected) {
        console.log("⚠️ 이미 WebSocket 연결됨 - 중복 연결 방지");
        return;
      }

      console.log("🔵 WebSocket 연결 시작...", { chatroomId });
      // CloudFront를 통한 Chat Service 접근 (WebSocket: /ws/*)
      const cloudfrontURL = process.env.REACT_APP_CLOUDFRONT_URL || "https://d82dq0ggv7fb.cloudfront.net";
      const chatBaseURL = process.env.REACT_APP_CHAT_API_URL || cloudfrontURL;
      const socket = new SockJS(`${chatBaseURL}/ws`);
      const client = Stomp.over(socket);

      // 디버그 모드 비활성화 (로그 줄이기)
      client.debug = () => {};

      stompClientRef.current = client;

      client.connect(
        {}, // headers
        () => {
          // 성공 콜백
          console.log("🟢 STOMP connected");
          // 채팅방 구독
          const subscription = client.subscribe(`/topic/chatrooms/${chatroomId}`, (message) => {
            console.log("📨 WS 원본 수신:", message.body);
            try {
              // ref를 통해 최신 onMessage 함수 호출
              onMessageRef.current(JSON.parse(message.body));
            } catch (e) {
              console.error("❌ 메시지 파싱 실패:", e);
            }
          });
          subscriptionRef.current = subscription;
          console.log(`✅ 채팅방 구독 완료: /topic/chatrooms/${chatroomId}`);
          // 외부에서 전달된 onConnect 있으면 호출
          if (callbacks.onConnect) callbacks.onConnect();
        },
        (error) => {
          // 에러 콜백
          console.error("❌ STOMP 연결 실패:", error);
          if (callbacks.onError) callbacks.onError(error);
        }
      );
    },
    [chatroomId] // onMessage 의존성 제거
  );

  // 연결 해제, 컴포넌트 언마운트 시 호출
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      console.log("🔴 구독 해제됨");
      subscriptionRef.current = null;
    }
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.disconnect(() => {
        console.log("🔴 WebSocket disconnected");
      });
      stompClientRef.current = null;
    }
  }, []);

  // 서버로 전송
  const sendMessage = useCallback((payload) => {
    const client = stompClientRef.current;
    if (!client || !client.connected) {
      console.warn("⚠️ STOMP 아직 연결 안 됨");
      return false;
    }
    try {
      client.send(`/app/chat/message`, {}, JSON.stringify(payload));
      console.log("✅ 메시지 전송 성공:", payload);
      return true;
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
      return false;
    }
  }, []);

  return {
    sendMessage,
    connect,
    disconnect,
    stompClient: stompClientRef, // ← 이렇게 반환해야 페이지에서 사용 가능!
  };
};

export default useChatWebSocket;
