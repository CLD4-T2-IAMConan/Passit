import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// 커스텀 메트릭
const errorRate = new Rate("errors");

// 테스트 옵션
export const options = {
  stages: [
    { duration: "1m", target: 20 }, // 1분 동안 20명으로 증가
    { duration: "2m", target: 50 }, // 2분 동안 50명으로 유지
    { duration: "1m", target: 0 }, // 1분 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95%의 요청이 5초 이내
    http_req_failed: ["rate<0.05"], // 에러율 5% 미만
    errors: ["rate<0.1"],
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_EMAIL_PREFIX = __ENV.TEST_EMAIL_PREFIX || `loadtest-${Date.now()}`;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "Test1234!";

export default function () {
  const userId = __VU; // Virtual User ID
  const email = `${TEST_EMAIL_PREFIX}-${userId}@example.com`;

  // 1. 로그인
  const loginPayload = JSON.stringify({
    email: email,
    password: TEST_PASSWORD,
  });

  const loginParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "Login" },
  };

  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    loginParams
  );

  const loginSuccess = check(loginResponse, {
    "login status is 200": (r) => r.status === 200,
    "login has accessToken": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.accessToken;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    return; // 로그인 실패 시 종료
  }

  // 토큰 추출
  let accessToken = null;
  try {
    const body = JSON.parse(loginResponse.body);
    accessToken = body.data?.accessToken;
  } catch (e) {
    return;
  }

  sleep(1);

  // 2. 티켓 목록 조회
  const listParams = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    tags: { name: "TicketList" },
  };

  const listResponse = http.get(
    `${BASE_URL}/api/tickets?page=0&size=20`,
    listParams
  );

  const listSuccess = check(listResponse, {
    "ticket list status is 200": (r) => r.status === 200,
  });

  errorRate.add(!listSuccess);

  sleep(1);

  // 3. 티켓 상세 조회
  let ticketId = 1;
  if (listSuccess) {
    try {
      const body = JSON.parse(listResponse.body);
      if (body.data?.content && body.data.content.length > 0) {
        ticketId =
          body.data.content[0].id || body.data.content[0].ticketId || 1;
      }
    } catch (e) {
      // 기본값 사용
    }
  }

  const detailParams = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    tags: { name: "TicketDetail" },
  };

  const detailResponse = http.get(
    `${BASE_URL}/api/tickets/${ticketId}`,
    detailParams
  );

  const detailSuccess = check(detailResponse, {
    "ticket detail status is 200": (r) => r.status === 200,
  });

  errorRate.add(!detailSuccess);

  sleep(1);

  // 4. 공지사항 조회 (인증 불필요)
  const noticeParams = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "NoticeList" },
  };

  const noticeResponse = http.get(`${BASE_URL}/notices`, noticeParams);

  const noticeSuccess = check(noticeResponse, {
    "notice list status is 200": (r) => r.status === 200,
  });

  errorRate.add(!noticeSuccess);

  sleep(1);
}
