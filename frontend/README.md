# Passit Frontend

안전한 티켓 거래 플랫폼 Passit의 프론트엔드 애플리케이션입니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [API 연동](#api-연동)
- [컴포넌트 가이드](#컴포넌트-가이드)
- [상태 관리](#상태-관리)
- [스타일링](#스타일링)
- [배포](#배포)

---

## 🛠 기술 스택

### Core
- **React** 19.2.1 - UI 라이브러리
- **React Router DOM** 7.10.1 - 클라이언트 사이드 라우팅
- **TypeScript** 5.9.3 - 타입 안정성 (점진적 도입)

### UI & Styling
- **Material-UI (MUI)** 7.3.6 - UI 컴포넌트 라이브러리
- **Emotion** 11.14.0 - CSS-in-JS

### State Management
- **React Context API** - 전역 상태 관리

### API Communication
- **Axios** - HTTP 클라이언트

### Build Tools
- **Create React App** 5.0.1

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 16.0.0 이상
- npm 7.0.0 이상

### 설치

```bash
# 의존성 설치
npm install --legacy-peer-deps

# 환경 변수 설정
cp .env.example .env
```

### 개발 서버 실행

```bash
npm start
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

### 빌드

```bash
npm run build
```

---

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── api/                    # API 레이어
│   │   ├── client.js
│   │   ├── endpoints.js
│   │   └── services/
│   ├── components/
│   │   ├── common/             # 공통 컴포넌트
│   │   └── ErrorBoundary.js
│   ├── pages/
│   ├── contexts/               # Context API
│   ├── hooks/                  # 커스텀 훅 (TypeScript)
│   └── config/
└── public/
```

---

## 💻 개발 가이드

### 코딩 컨벤션

- **컴포넌트**: PascalCase
- **유틸/서비스**: camelCase
- **TypeScript**: 새 파일은 TS로 작성
- **Hooks 순서**: useState → useEffect → custom hooks

### API 클라이언트 사용

```javascript
import { authService } from "../api";

const handleLogin = async () => {
  const { user, token } = await authService.login({
    email: "user@example.com",
    password: "password"
  });
};
```

### 공통 컴포넌트

```jsx
import { FormField, PasswordField, LoadingSpinner } from "../components/common";

<PasswordField
  name="password"
  value={password}
  onChange={handleChange}
  showStrengthIndicator={true}
/>
```

### 커스텀 훅

```typescript
import { usePasswordStrength, useTimer } from "../hooks";

const { label, strength } = usePasswordStrength(password);
const { timer, startTimer } = useTimer();
```

### 상태 관리

```javascript
import { useAuth } from "../contexts/AuthContext";

const { user, isAuthenticated, login, logout } = useAuth();
```
