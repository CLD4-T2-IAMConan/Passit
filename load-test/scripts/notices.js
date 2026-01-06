import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// 커스텀 메트릭
const errorRate = new Rate("errors");

// 테스트 옵션
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // 30초 동안 50명으로 증가
    { duration: "1m", target: 200 }, // 1분 동안 200명으로 증가
    { duration: "30s", target: 0 }, // 30초 동안 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"], // 95%의 요청이 1초 이내
    http_req_failed: ["rate<0.01"], // 에러율 1% 미만
    errors: ["rate<0.05"],
  },
};

// 환경 변수
const BASE_URL = __ENV.BASE_URL || "http://localhost:8085";

export default function () {
  // 공지사항 목록 조회 (읽기 전용, 높은 부하 가능)
  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "NoticeList" },
  };

  const response = http.get(`${BASE_URL}/notices`, params);

  const success = check(response, {
    "notice list status is 200": (r) => r.status === 200,
    "notice list has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body.data && Array.isArray(body.data));
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);

  sleep(0.5); // 읽기 전용이므로 짧은 대기
}
