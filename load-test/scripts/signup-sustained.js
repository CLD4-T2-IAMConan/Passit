import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

// 50명 유지 부하 테스트
export const options = {
  stages: [
    { duration: "30s", target: 50 },  // 30초 동안 50명으로 증가
    { duration: "3m", target: 50 },   // 3분 동안 50명 유지
    { duration: "30s", target: 0 },   // 30초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.05"],
    errors: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";

export default function () {
  const timestamp = Date.now();
  const userId = __VU;
  const iteration = __ITER;
  const email = `loadtest-${timestamp}-${userId}-${iteration}@example.com`;

  const signupPayload = JSON.stringify({
    email: email,
    password: "Password123!",
    name: `LoadTest User ${userId}-${iteration}`,
  });

  const signupParams = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const signupResponse = http.post(
    `${BASE_URL}/api/auth/signup`,
    signupPayload,
    signupParams
  );

  const signupSuccess = check(signupResponse, {
    "signup status is 201": (r) => r.status === 201,
    "signup has userId": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.userId;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!signupSuccess);

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options) {
  const duration = data.state.testRunDurationMs / 1000;
  const rps = data.metrics.http_reqs.values.count / duration;
  
  return `
테스트 완료
==========
총 요청 수: ${data.metrics.http_reqs.values.count}
테스트 시간: ${duration.toFixed(2)}초
평균 응답 시간: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
P95 응답 시간: ${data.metrics.http_req_duration.values["p(95)"].toFixed(2)}ms
P99 응답 시간: ${data.metrics.http_req_duration.values["p(99)"].toFixed(2)}ms
최소 응답 시간: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
최대 응답 시간: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
에러율: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
RPS: ${rps.toFixed(2)}
`;
}
