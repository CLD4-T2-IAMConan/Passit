import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";
import { Rate, Counter } from "k6/metrics";

// 커스텀 메트릭
const errorRate = new Rate("ws_errors");
const messagesSent = new Counter("messages_sent");
const messagesReceived = new Counter("messages_received");
const connectionErrors = new Counter("connection_errors");

// WebSocket 테스트 옵션
export const options = {
  stages: [
    { duration: "20s", target: 10 }, // 20초 동안 10명으로 증가
    { duration: "40s", target: 50 }, // 40초 동안 50명으로 증가
    { duration: "30s", target: 30 }, // 30초 동안 30명 유지
    { duration: "20s", target: 0 }, // 20초 동안 0명으로 감소
  ],
  thresholds: {
    ws_errors: ["rate<0.1"], // WebSocket 에러율 10% 미만
    ws_connecting: ["p(95)<3000"], // 연결 시간 95%가 3초 이내
    ws_session_duration: ["p(95)<60000"], // 세션 지속 시간
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:8084";
const WS_URL = __ENV.WS_URL || "ws://localhost:8084/ws";

export default function () {
  const userId = Math.floor(Math.random() * 100) + 1;
  const chatroomId = Math.floor(Math.random() * 20) + 1; // 1~20 채팅방 중 하나

  // 먼저 REST API로 채팅방이 존재하는지 확인하고 없으면 생성
  const createRoomPayload = JSON.stringify({
    ticketId: chatroomId,
    buyerId: userId,
  });

  http.post(`${BASE_URL}/chat/rooms`, createRoomPayload, {
    headers: { "Content-Type": "application/json" },
  });

  sleep(0.5);

  // WebSocket 연결
  const url = WS_URL;
  const params = {
    tags: { name: "ChatWebSocket" },
  };

  const response = ws.connect(url, params, function (socket) {
    socket.on("open", function open() {
      console.log(`[VU ${__VU}] WebSocket 연결 성공, 채팅방 ${chatroomId} 구독 시도`);

      // STOMP CONNECT 프레임 전송
      const connectFrame = `CONNECT
accept-version:1.1,1.0
heart-beat:10000,10000

\0`;
      socket.send(connectFrame);

      socket.setTimeout(function () {
        // 채팅방 구독
        const subscribeFrame = `SUBSCRIBE
id:sub-${userId}
destination:/topic/chatrooms/${chatroomId}

\0`;
        socket.send(subscribeFrame);

        // 메시지 전송 시뮬레이션
        for (let i = 0; i < 5; i++) {
          const message = JSON.stringify({
            chatroomId: chatroomId,
            senderId: userId,
            content: `테스트 메시지 ${i + 1} from user ${userId}`,
            type: "TEXT",
          });

          const sendFrame = `SEND
destination:/pub/chat/message
content-type:application/json
content-length:${message.length}

${message}\0`;

          socket.send(sendFrame);
          messagesSent.add(1);

          console.log(
            `[VU ${__VU}] 메시지 전송: 채팅방 ${chatroomId}, 메시지 ${i + 1}`
          );

          socket.setTimeout(function () {}, 1000 * i);
        }

        // 연결 유지 후 종료
        socket.setTimeout(function () {
          socket.close();
        }, 6000);
      }, 500);
    });

    socket.on("message", function (data) {
      console.log(`[VU ${__VU}] 메시지 수신:`, data);
      messagesReceived.add(1);

      // STOMP 프레임 파싱 및 검증
      const isValid = check(data, {
        "message is not empty": (d) => d && d.length > 0,
        "message is STOMP frame": (d) => {
          return (
            d.includes("MESSAGE") ||
            d.includes("CONNECTED") ||
            d.includes("ERROR")
          );
        },
      });

      if (!isValid) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });

    socket.on("error", function (e) {
      console.error(`[VU ${__VU}] WebSocket 에러:`, e.error());
      errorRate.add(1);
      connectionErrors.add(1);
    });

    socket.on("close", function () {
      console.log(`[VU ${__VU}] WebSocket 연결 종료`);
    });
  });

  check(response, {
    "websocket handshake successful": (r) => r && r.status === 101,
  });

  sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const summary = textSummary(data);

  console.log(summary);

  return {
    stdout: summary,
    [`results/dev/chat-websocket-${timestamp}.json`]: JSON.stringify(
      data,
      null,
      2
    ),
  };
}

function textSummary(data) {
  const metrics = data.metrics;

  return `
========================================
  Chat 서비스 WebSocket 부하테스트 결과
========================================

🔌 WebSocket 연결
----------------
총 연결 시도: ${metrics.ws_connecting?.values.count || 0}
성공한 연결: ${metrics.ws_sessions?.values.count || 0}
평균 연결 시간: ${metrics.ws_connecting?.values.avg?.toFixed(2) || 0}ms
P95 연결 시간: ${metrics.ws_connecting?.values["p(95)"]?.toFixed(2) || 0}ms

💬 메시지 전송/수신
-----------------
전송한 메시지: ${metrics.messages_sent?.values.count || 0}
수신한 메시지: ${metrics.messages_received?.values.count || 0}
메시지 처리율: ${
    metrics.messages_sent?.values.count > 0
      ? (
          ((metrics.messages_received?.values.count || 0) /
            metrics.messages_sent.values.count) *
          100
        ).toFixed(2)
      : 0
  }%

⏱️  세션 지속 시간
----------------
평균: ${metrics.ws_session_duration?.values.avg?.toFixed(2) || 0}ms
최소: ${metrics.ws_session_duration?.values.min?.toFixed(2) || 0}ms
최대: ${metrics.ws_session_duration?.values.max?.toFixed(2) || 0}ms
P95: ${metrics.ws_session_duration?.values["p(95)"]?.toFixed(2) || 0}ms

❌ 에러
------
WebSocket 에러율: ${((metrics.ws_errors?.values.rate || 0) * 100).toFixed(2)}%
연결 에러: ${metrics.connection_errors?.values.count || 0}

📊 전체 통계
----------
테스트 지속 시간: ${(data.state.testRunDurationMs / 1000).toFixed(2)}초
동시 사용자 수 (VUs): ${metrics.vus?.values.value || 0}
최대 VUs: ${metrics.vus_max?.values.value || 0}
총 데이터 수신: ${((metrics.data_received?.values.count || 0) / 1024).toFixed(2)} KB
총 데이터 송신: ${((metrics.data_sent?.values.count || 0) / 1024).toFixed(2)} KB

========================================
`;
}

