import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// 커스텀 메트릭
const errorRate = new Rate("errors");

// 테스트 옵션
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // 30초 동안 20명으로 증가
    { duration: "1m", target: 100 }, // 1분 동안 100명으로 증가
    { duration: "30s", target: 50 }, // 30초 동안 50명 유지
    { duration: "30s", target: 0 }, // 30초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // 95%의 요청이 3초 이내
    http_req_failed: ["rate<0.05"], // 에러율 5% 미만
    errors: ["rate<0.1"],
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:8084";
const TEST_USER_ID = __ENV.TEST_USER_ID || "1";
const TEST_TICKET_ID = __ENV.TEST_TICKET_ID || "1";

export default function () {
  const userId = Math.floor(Math.random() * 100) + 1; // 1~100 사이의 랜덤 userId
  const buyerId = Math.floor(Math.random() * 100) + 1;
  const ticketId = Math.floor(Math.random() * 50) + 1; // 1~50 사이의 랜덤 ticketId

  // 1. 채팅방 생성
  const createRoomPayload = JSON.stringify({
    ticketId: ticketId,
    buyerId: buyerId,
  });

  const createParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "CreateChatRoom" },
  };

  const createResponse = http.post(
    `${BASE_URL}/chat/rooms`,
    createRoomPayload,
    createParams
  );

  const createSuccess = check(createResponse, {
    "create room status is 200 or 409": (r) =>
      r.status === 200 || r.status === 409, // 이미 존재하는 채팅방일 수 있음
    "create room response is valid": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!createSuccess);

  let chatroomId = null;
  if (createSuccess && createResponse.status === 200) {
    try {
      const body = JSON.parse(createResponse.body);
      chatroomId = body.data?.chatroomId || body.data?.id;
    } catch (e) {
      // 파싱 실패
    }
  }

  sleep(0.5);

  // 2. 채팅방 목록 조회
  const listParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "GetChatRooms" },
  };

  const listResponse = http.get(
    `${BASE_URL}/chat/rooms?userId=${userId}`,
    listParams
  );

  const listSuccess = check(listResponse, {
    "list rooms status is 200": (r) => r.status === 200,
    "list rooms has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!listSuccess);

  // 목록에서 채팅방 ID 추출 (생성 실패 시 대체용)
  if (!chatroomId && listSuccess) {
    try {
      const body = JSON.parse(listResponse.body);
      if (body.data && body.data.length > 0) {
        chatroomId = body.data[0].chatroomId || body.data[0].id;
      }
    } catch (e) {
      // 파싱 실패
    }
  }

  sleep(0.5);

  // 3. 메시지 목록 조회 (채팅방 ID가 있는 경우만)
  if (chatroomId) {
    const messagesParams = {
      headers: {
        "Content-Type": "application/json",
      },
      tags: { name: "GetMessages" },
    };

    const messagesResponse = http.get(
      `${BASE_URL}/chat/rooms/${chatroomId}/messages`,
      messagesParams
    );

    const messagesSuccess = check(messagesResponse, {
      "get messages status is 200": (r) => r.status === 200,
      "get messages has data": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(!messagesSuccess);

    sleep(0.5);

    // 4. 메시지 읽음 처리 (메시지가 있는 경우만)
    if (messagesSuccess) {
      try {
        const body = JSON.parse(messagesResponse.body);
        if (body.data && body.data.length > 0) {
          const lastMessageId = body.data[body.data.length - 1].messageId;

          const readParams = {
            headers: {
              "Content-Type": "application/json",
            },
            tags: { name: "MarkAsRead" },
          };

          const readResponse = http.post(
            `${BASE_URL}/chat/rooms/${chatroomId}/read?userId=${userId}&lastReadMessageId=${lastMessageId}`,
            null,
            readParams
          );

          const readSuccess = check(readResponse, {
            "mark as read status is 200": (r) => r.status === 200,
          });

          errorRate.add(!readSuccess);
        }
      } catch (e) {
        // 파싱 실패
      }
    }
  }

  sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const summary = textSummary(data);

  console.log(summary);

  return {
    stdout: summary,
    [`results/dev/chat-${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const metrics = data.metrics;

  return `
========================================
  Chat 서비스 REST API 부하테스트 결과
========================================

📊 기본 지표
------------
총 요청 수: ${metrics.http_reqs?.values.count || 0}
총 데이터 수신: ${((metrics.data_received?.values.count || 0) / 1024 / 1024).toFixed(2)} MB
총 데이터 송신: ${((metrics.data_sent?.values.count || 0) / 1024).toFixed(2)} KB
테스트 지속 시간: ${(data.state.testRunDurationMs / 1000).toFixed(2)}초

⏱️  응답 시간
------------
평균: ${metrics.http_req_duration?.values.avg.toFixed(2) || 0}ms
최소: ${metrics.http_req_duration?.values.min.toFixed(2) || 0}ms
중간값: ${metrics.http_req_duration?.values.med.toFixed(2) || 0}ms
최대: ${metrics.http_req_duration?.values.max.toFixed(2) || 0}ms
P90: ${metrics.http_req_duration?.values["p(90)"]?.toFixed(2) || 0}ms
P95: ${metrics.http_req_duration?.values["p(95)"]?.toFixed(2) || 0}ms
P99: ${metrics.http_req_duration?.values["p(99)"]?.toFixed(2) || 0}ms

✅ 성공률
--------
요청 성공률: ${((1 - (metrics.http_req_failed?.values.rate || 0)) * 100).toFixed(2)}%
요청 실패율: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%
커스텀 에러율: ${((metrics.errors?.values.rate || 0) * 100).toFixed(2)}%

🔥 처리량
--------
초당 요청 수 (RPS): ${(metrics.http_reqs?.values.rate || 0).toFixed(2)}
동시 사용자 수 (VUs): ${metrics.vus?.values.value || 0}
최대 VUs: ${metrics.vus_max?.values.value || 0}

📈 API별 태그 정보
----------------
${
  metrics.http_req_duration?.values.tags
    ? Object.entries(metrics.http_req_duration.values.tags)
        .map(([tag, value]) => `${tag}: ${JSON.stringify(value)}`)
        .join("\n")
    : "태그 정보 없음"
}

========================================
`;
}

