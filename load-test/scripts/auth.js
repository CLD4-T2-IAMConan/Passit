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
    http_req_duration: ["p(95)<2000"], // 95%의 요청이 2초 이내
    http_req_failed: ["rate<0.05"], // 에러율 5% 미만
    errors: ["rate<0.1"],
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
const TEST_EMAIL = __ENV.TEST_EMAIL || `loadtest-${Date.now()}@example.com`;
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "Test1234!";

export default function () {
  // 로그인 API 테스트
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const loginParams = {
    headers: {
      "Content-Type": "application/json",
    },
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

  // 토큰 추출 (다음 요청에 사용 가능)
  let accessToken = null;
  if (loginSuccess) {
    try {
      const body = JSON.parse(loginResponse.body);
      accessToken = body.data?.accessToken;
    } catch (e) {
      // 파싱 실패
    }
  }

  sleep(1); // 요청 간 1초 대기
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  // 간단한 텍스트 요약
  return `
테스트 완료
==========
총 요청 수: ${data.metrics.http_reqs.values.count}
평균 응답 시간: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
P95 응답 시간: ${data.metrics.http_req_duration.values["p(95)"].toFixed(2)}ms
에러율: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
`;
}
