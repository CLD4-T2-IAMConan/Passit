#!/usr/bin/env node

/**
 * k6 결과 JSON 파일을 분석하여 요약 리포트 생성
 * 사용법: node analyze-results.js results/dev/auth-20250106-120000.json
 *
 * k6의 JSON 출력은 NDJSON (Newline Delimited JSON) 형식입니다.
 * 각 줄이 하나의 JSON 객체입니다.
 */

const fs = require("fs");
const path = require("path");

const resultFile = process.argv[2];

if (!resultFile || !fs.existsSync(resultFile)) {
  console.error("❌ 결과 파일을 찾을 수 없습니다.");
  console.error("사용법: node analyze-results.js <result-file.json>");
  process.exit(1);
}

// NDJSON 파일 읽기 및 파싱
const fileContent = fs.readFileSync(resultFile, "utf8");
const lines = fileContent.trim().split("\n");

// 메트릭 정의 및 데이터 포인트 수집
const metrics = {};
const metricDefinitions = {};
let testStartTime = null;
let testEndTime = null;

lines.forEach((line, index) => {
  try {
    const obj = JSON.parse(line);

    // 메트릭 정의 수집
    if (obj.type === "Metric") {
      metricDefinitions[obj.metric] = obj.data;
    }

    // 데이터 포인트 수집
    if (obj.type === "Point" && obj.metric) {
      if (!metrics[obj.metric]) {
        metrics[obj.metric] = {
          values: [],
          tags: {},
        };
      }

      // 시간 추적
      if (obj.data && obj.data.time) {
        const pointTime = new Date(obj.data.time).getTime();
        if (!testStartTime || pointTime < testStartTime) {
          testStartTime = pointTime;
        }
        if (!testEndTime || pointTime > testEndTime) {
          testEndTime = pointTime;
        }
      }

      // 값 수집
      if (obj.data && obj.data.value !== undefined) {
        metrics[obj.metric].values.push({
          value: obj.data.value,
          time: obj.data.time,
          tags: obj.data.tags || {},
        });
      }
    }
  } catch (e) {
    // JSON 파싱 실패 시 무시 (빈 줄 등)
    if (line.trim() !== "") {
      console.warn(`⚠️  라인 ${index + 1} 파싱 실패: ${e.message}`);
    }
  }
});

// 메트릭 집계
const httpReqs = metrics.http_reqs || { values: [] };
const httpDuration = metrics.http_req_duration || { values: [] };
const httpFailed = metrics.http_req_failed || { values: [] };
const iterations = metrics.iterations || { values: [] };

// 총 요청 수 (마지막 포인트의 누적 값)
let totalRequests = 0;
if (httpReqs.values.length > 0) {
  // 마지막 포인트의 값이 총 누적 요청 수
  totalRequests = httpReqs.values[httpReqs.values.length - 1].value;

  // 만약 값이 너무 작다면 (카운터가 아니라면), 포인트 수를 사용
  if (totalRequests < httpReqs.values.length) {
    totalRequests = httpReqs.values.length;
  }
}

// 응답 시간 통계 계산
const durations = httpDuration.values
  .map((v) => v.value)
  .filter((v) => !isNaN(v));
durations.sort((a, b) => a - b);

const avgDuration =
  durations.length > 0
    ? durations.reduce((sum, val) => sum + val, 0) / durations.length
    : 0;

const p95Index = Math.floor(durations.length * 0.95);
const p95Duration =
  durations.length > 0 && p95Index < durations.length ? durations[p95Index] : 0;

const p99Index = Math.floor(durations.length * 0.99);
const p99Duration =
  durations.length > 0 && p99Index < durations.length ? durations[p99Index] : 0;

// 에러율 계산 (마지막 값)
const errorRate =
  httpFailed.values.length > 0
    ? httpFailed.values[httpFailed.values.length - 1].value * 100
    : 0;

// RPS 계산 (총 요청 수 / 테스트 시간)
const testDuration =
  testEndTime && testStartTime
    ? (testEndTime - testStartTime) / 1000 // 초 단위
    : 0;

const rps =
  testDuration > 0 && totalRequests > 0 ? totalRequests / testDuration : 0;

// 총 반복 횟수
const totalIterations =
  iterations.values.length > 0
    ? iterations.values[iterations.values.length - 1].value
    : 0;

// 리포트 출력
console.log("\n📊 부하 테스트 결과 요약");
console.log("=".repeat(50));
console.log(`파일: ${path.basename(resultFile)}`);
console.log(`테스트 시간: ${testDuration.toFixed(2)}초`);
console.log(`총 반복 횟수: ${totalIterations.toLocaleString()}`);
console.log("");
console.log("📈 핵심 지표");
console.log("-".repeat(50));
console.log(`총 요청 수: ${totalRequests.toLocaleString()}`);
console.log(`RPS (초당 요청 수): ${rps.toFixed(2)}`);
console.log(`평균 응답 시간: ${avgDuration.toFixed(2)}ms`);
console.log(`P95 응답 시간: ${p95Duration.toFixed(2)}ms`);
console.log(`P99 응답 시간: ${p99Duration.toFixed(2)}ms`);
console.log(`에러율: ${errorRate.toFixed(2)}%`);
console.log("");

// 상태 평가
let status = "✅ 양호";
if (p95Duration > 5000 || errorRate > 5) {
  status = "⚠️ 주의 필요";
}
if (p95Duration > 10000 || errorRate > 10) {
  status = "❌ 개선 필요";
}

console.log(`상태: ${status}`);
console.log("");

// HTTP 상태 코드 분포
// k6의 JSON 출력에서 각 포인트는 개별 요청을 나타냅니다
let statusCodes = {};
const statusCodeCounts = {}; // 상태 코드별 포인트 수

// 각 포인트를 순회하며 상태 코드별 포인트 수 카운트
httpReqs.values.forEach((point) => {
  if (point.tags && point.tags.status) {
    const status = point.tags.status;
    statusCodeCounts[status] = (statusCodeCounts[status] || 0) + 1;
  }
});

// 포인트 수를 기반으로 상태 코드 분포 계산
// 실제 요청 수와 포인트 수가 다를 수 있으므로, 비율로 계산
const totalPoints = httpReqs.values.length;
if (totalPoints > 0 && Object.keys(statusCodeCounts).length > 0) {
  Object.entries(statusCodeCounts).forEach(([status, count]) => {
    // 포인트 비율을 기반으로 실제 요청 수 추정
    const ratio = count / totalPoints;
    statusCodes[status] = Math.round(totalRequests * ratio);
  });
}

if (Object.keys(statusCodes).length > 0) {
  console.log("📋 HTTP 상태 코드 분포");
  console.log("-".repeat(50));
  const totalStatusCount = Object.values(statusCodes).reduce(
    (sum, count) => sum + count,
    0
  );
  Object.entries(statusCodes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage =
        totalStatusCount > 0
          ? ((count / totalStatusCount) * 100).toFixed(2)
          : 0;
      console.log(`  ${status}: ${count.toLocaleString()} (${percentage}%)`);
    });
  console.log("");
}

console.log("=".repeat(50));
