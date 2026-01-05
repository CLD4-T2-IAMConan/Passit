import { http, HttpResponse } from "msw";

// CloudFront를 통한 Account Service 접근 (개발용 Mock)
const CLOUDFRONT_URL =
  process.env.REACT_APP_CLOUDFRONT_URL || "https://d82dq0ggv7fb.cloudfront.net";
const API_BASE_URL = process.env.REACT_APP_ACCOUNT_API_URL || `${CLOUDFRONT_URL}/api`;

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    try {
      const body = await request.json();

      if (body.email === "test@example.com" && body.password === "password123") {
        return HttpResponse.json({
          success: true,
          data: {
            userId: 1,
            email: "test@example.com",
            name: "Test User",
            role: "USER",
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresIn: 3600000,
          },
          message: "로그인 성공",
        });
      }

      return HttpResponse.json(
        {
          success: false,
          error: {
            message: "이메일 또는 비밀번호가 일치하지 않습니다",
          },
        },
        { status: 401 }
      );
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            message: "요청 처리 중 오류가 발생했습니다",
          },
        },
        { status: 400 }
      );
    }
  }),

  http.post(`${API_BASE_URL}/auth/signup`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        userId: 2,
        email: body.email,
        name: body.name,
        nickname: body.nickname,
        role: "USER",
        status: "ACTIVE",
      },
      message: "회원가입이 완료되었습니다",
    });
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: "new-mock-access-token",
        expiresIn: 3600000,
      },
      message: "토큰 갱신 성공",
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, async () => {
    return HttpResponse.json({
      success: true,
      message: "로그아웃 성공",
    });
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/users/me`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: 1,
        email: "test@example.com",
        name: "Test User",
        nickname: "tester",
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
  }),

  http.patch(`${API_BASE_URL}/users/me`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        userId: 1,
        email: "test@example.com",
        name: body.name || "Test User",
        nickname: body.nickname || "tester",
        role: "USER",
      },
      message: "회원정보가 수정되었습니다",
    });
  }),

  http.post(`${API_BASE_URL}/users/me/password`, async () => {
    return HttpResponse.json({
      success: true,
      message: "비밀번호가 변경되었습니다",
    });
  }),

  // Admin endpoints
  http.get(`${API_BASE_URL}/users/search`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0");
    const size = parseInt(url.searchParams.get("size") || "10");

    return HttpResponse.json({
      success: true,
      data: {
        content: [
          {
            userId: 1,
            email: "user1@example.com",
            name: "User 1",
            nickname: "user1",
            role: "USER",
            status: "ACTIVE",
          },
          {
            userId: 2,
            email: "user2@example.com",
            name: "User 2",
            nickname: "user2",
            role: "USER",
            status: "ACTIVE",
          },
        ],
        page: {
          number: page,
          size: size,
          totalElements: 2,
          totalPages: 1,
        },
      },
    });
  }),

  // Email verification endpoints
  http.post(`${API_BASE_URL}/auth/send-verification-code`, async () => {
    return HttpResponse.json({
      success: true,
      message: "인증 코드가 전송되었습니다",
    });
  }),

  http.post(`${API_BASE_URL}/auth/verify-email`, async () => {
    return HttpResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다",
    });
  }),
];
