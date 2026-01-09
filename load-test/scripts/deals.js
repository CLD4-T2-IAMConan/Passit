import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// 커스텀 메트릭
const errorRate = new Rate("errors");

// 테스트 옵션
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // 30초 동안 10명으로 증가
    { duration: "1m", target: 50 }, // 1분 동안 50명으로 증가
    { duration: "30s", target: 0 }, // 30초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95%의 요청이 5초 이내
    http_req_failed: ["rate<0.05"], // 에러율 5% 미만
    errors: ["rate<0.1"],
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:8083";
const TEST_USER_ID = parseInt(__ENV.TEST_USER_ID || "1");
const TEST_TICKET_ID = parseInt(__ENV.TEST_TICKET_ID || "1");

export default function () {
  // 거래 요청 API 테스트
  const dealPayload = JSON.stringify({
    ticketId: TEST_TICKET_ID,
    buyerId: TEST_USER_ID,
    quantity: 1,
  });

  const dealParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "DealRequest" },
  };

  const dealResponse = http.post(
    `${BASE_URL}/api/deals/request`,
    dealPayload,
    dealParams
  );

  const dealSuccess = check(dealResponse, {
    "deal request status is 201 or 200": (r) =>
      r.status === 201 || r.status === 200,
    "deal request has response": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body !== null;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!dealSuccess);

  sleep(2); // 거래 요청은 DB 트랜잭션이므로 더 긴 대기
}
