const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Account Service - 인증, 회원 관리
  app.use(
    "/api/auth",
    createProxyMiddleware({
      target: process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081",
      changeOrigin: true,
      logLevel: "debug",
      secure: false,
      timeout: 60000, // 60초 타임아웃
      proxyTimeout: 60000,
      // 경로 복원: app.use('/api/auth')로 인해 /api/auth가 제거되므로 다시 추가
      // /api/auth/login 요청 -> /login으로 변환됨 -> /api/auth/login으로 복원
      pathRewrite: function (path, req) {
        // /login -> /api/auth/login으로 복원
        const rewrittenPath = `/api/auth${path}`;
        console.log(`[Proxy PathRewrite] ${path} -> ${rewrittenPath}`);
        return rewrittenPath;
      },
      // CORS 관련 설정
      onProxyReq: (proxyReq, req, res) => {
        // 프록시 요청 로그
        console.log(
          `[Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader("host")}${proxyReq.path}`
        );

        // 요청 헤더 전체 확인 (403 디버깅용)
        console.log(`[Proxy Request Headers]`, {
          method: req.method,
          url: req.url,
          "content-type": req.headers["content-type"],
          origin: req.headers.origin,
          referer: req.headers.referer,
          "user-agent": req.headers["user-agent"],
          host: req.headers.host,
          "access-control-request-method": req.headers["access-control-request-method"],
          "access-control-request-headers": req.headers["access-control-request-headers"],
          authorization: req.headers.authorization ? "***" : undefined,
        });

        // 프록시가 전달하는 실제 요청 헤더 확인
        console.log(`[Proxy Forward Headers]`, {
          host: proxyReq.getHeader("host"),
          "content-type": proxyReq.getHeader("content-type"),
          origin: proxyReq.getHeader("origin"),
          authorization: proxyReq.getHeader("authorization") ? "***" : undefined,
        });

        // OPTIONS 요청 (CORS preflight) 처리
        if (req.method === "OPTIONS") {
          console.log("[Proxy] Handling OPTIONS preflight request");
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // CORS 헤더 확인 및 로깅
        console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.method} ${req.url}`);

        // 응답 헤더 전체 확인
        console.log(`[Proxy Response Headers]`, {
          status: proxyRes.statusCode,
          "content-type": proxyRes.headers["content-type"],
          "access-control-allow-origin": proxyRes.headers["access-control-allow-origin"],
          "access-control-allow-methods": proxyRes.headers["access-control-allow-methods"],
          "access-control-allow-headers": proxyRes.headers["access-control-allow-headers"],
          "access-control-allow-credentials": proxyRes.headers["access-control-allow-credentials"],
        });

        // CORS 헤더가 없으면 추가 (백엔드에서 설정하지 않은 경우)
        if (!proxyRes.headers["access-control-allow-origin"]) {
          const origin = req.headers.origin || "http://localhost:3000";
          proxyRes.headers["access-control-allow-origin"] = origin;
          console.log(`[Proxy] Added CORS header: access-control-allow-origin=${origin}`);
        }

        // OPTIONS 요청에 대한 CORS 헤더 추가
        if (req.method === "OPTIONS") {
          if (!proxyRes.headers["access-control-allow-methods"]) {
            proxyRes.headers["access-control-allow-methods"] =
              "GET, POST, PUT, PATCH, DELETE, OPTIONS";
          }
          if (!proxyRes.headers["access-control-allow-headers"]) {
            proxyRes.headers["access-control-allow-headers"] =
              "Content-Type, Authorization, X-Requested-With";
          }
          if (!proxyRes.headers["access-control-allow-credentials"]) {
            proxyRes.headers["access-control-allow-credentials"] = "true";
          }
          if (!proxyRes.headers["access-control-max-age"]) {
            proxyRes.headers["access-control-max-age"] = "3600";
          }
        }

        // 403 에러인 경우 상세 정보 로깅
        if (proxyRes.statusCode === 403) {
          console.error(`[Proxy 403 Error - Detailed]`, {
            "Request Info": {
              url: req.url,
              method: req.method,
              path: req.path,
              originalUrl: req.originalUrl,
              origin: req.headers.origin,
              "content-type": req.headers["content-type"],
              "user-agent": req.headers["user-agent"],
            },
            "Request Headers (all)": req.headers,
            "Response Status": proxyRes.statusCode,
            "Response Headers (all)": proxyRes.headers,
            "Response Body": "Check network tab for response body",
          });

          // 응답 본문도 로깅 (가능한 경우)
          const chunks = [];
          const originalWrite = res.write;
          const originalEnd = res.end;

          res.write = function (chunk) {
            chunks.push(chunk);
            return originalWrite.apply(res, arguments);
          };

          res.end = function (chunk) {
            if (chunk) chunks.push(chunk);
            const body = Buffer.concat(chunks).toString("utf8");
            console.error(`[Proxy 403 Response Body]`, body);
            return originalEnd.apply(res, arguments);
          };
        }
      },
      onError: (err, req, res) => {
        console.error("[Proxy Error]", err.message);
        console.error("[Proxy Error Details]", {
          url: req.url,
          method: req.method,
          target: process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081",
          error: err,
        });
      },
    })
  );

  app.use(
    "/api/user",
    createProxyMiddleware({
      target: process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  app.use(
    "/api/account",
    createProxyMiddleware({
      target: process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  // Ticket Service - 티켓 관리
  app.use(
    "/api/tickets",
    createProxyMiddleware({
      target: process.env.REACT_APP_TICKET_API_URL || "http://localhost:8082",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  // Trade Service - 거래 관리
  app.use(
    "/api/deals",
    createProxyMiddleware({
      target: process.env.REACT_APP_TRADE_API_URL || "http://localhost:8083",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  app.use(
    "/api/payments",
    createProxyMiddleware({
      target: process.env.REACT_APP_TRADE_API_URL || "http://localhost:8083",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  app.use(
    "/api/trade",
    createProxyMiddleware({
      target: process.env.REACT_APP_TRADE_API_URL || "http://localhost:8083",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  // Chat Service - 채팅
  app.use(
    "/api/chat",
    createProxyMiddleware({
      target: process.env.REACT_APP_CHAT_API_URL || "http://localhost:8084",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
    })
  );

  // CS Service - 고객지원
  app.use(
    "/api/cs",
    createProxyMiddleware({
      target: process.env.REACT_APP_CS_API_URL || "http://localhost:8085",
      changeOrigin: true,
      logLevel: "debug",
      timeout: 60000,
      proxyTimeout: 60000,
      // 경로 변환:
      // app.use('/api/cs')로 인해 /api/cs가 제거되므로, path는 이미 /inquiries 형태
      // /inquiries -> /cs/inquiries
      // /admin/inquiries -> /admin/cs/inquiries
      pathRewrite: (path, req) => {
        // app.use('/api/cs')로 인해 path는 이미 /api/cs가 제거된 상태
        // 예: /api/cs/inquiries -> /inquiries
        let newPath = path;

        // /admin/* -> /admin/cs/*
        if (newPath.startsWith("/admin/")) {
          newPath = newPath.replace("/admin/", "/admin/cs/");
        } else {
          // /* -> /cs/*
          newPath = "/cs" + newPath;
        }
        console.log(`[CS Proxy PathRewrite] ${path} -> ${newPath}`);
        return newPath;
      },
    })
  );
};
