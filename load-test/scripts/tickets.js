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
    { duration: "30s", target: 0 }, // 30초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // 95%의 요청이 3초 이내
    http_req_failed: ["rate<0.05"], // 에러율 5% 미만
    errors: ["rate<0.1"],
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:8082";

export default function () {
  // 1. 티켓 목록 조회
  const listParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "TicketList" },
  };

  const listResponse = http.get(
    `${BASE_URL}/api/tickets?page=0&size=20`,
    listParams
  );

  const listSuccess = check(listResponse, {
    "ticket list status is 200": (r) => r.status === 200,
    "ticket list has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data !== null;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!listSuccess);

  sleep(1);

  // 2. 티켓 상세 조회 (목록에서 첫 번째 티켓 ID 사용)
  let ticketId = 1; // 기본값, 실제로는 목록에서 추출
  if (listSuccess) {
    try {
      const body = JSON.parse(listResponse.body);
      if (body.data?.content && body.data.content.length > 0) {
        ticketId =
          body.data.content[0].id || body.data.content[0].ticketId || 1;
      }
    } catch (e) {
      // 파싱 실패 시 기본값 사용
    }
  }

  const detailParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "TicketDetail" },
  };

  const detailResponse = http.get(
    `${BASE_URL}/api/tickets/${ticketId}`,
    detailParams
  );

  const detailSuccess = check(detailResponse, {
    "ticket detail status is 200": (r) => r.status === 200,
    "ticket detail has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data !== null;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!detailSuccess);

  sleep(1);
}
