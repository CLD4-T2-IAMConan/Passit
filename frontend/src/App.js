import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
import ChatListPage from "./pages/chat/ChatListPage";
import ChatRoomPage from "./pages/chat/ChatRoomPage";
import TicketCreatePage from "./pages/TicketCreatePage";
import TicketListPage from "./pages/TicketListPage";
import MyTicketListPage from "./pages/MyTicketListPage";


// 코드 스플리팅 - 페이지별 lazy loading
const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const KakaoCallbackPage = lazy(() => import("./pages/KakaoCallbackPage"));

// 마이페이지
const MyPageLayout = lazy(() => import("./layouts/MyPageLayout"));
const ProfilePage = lazy(() => import("./pages/mypage/ProfilePage"));

// 관리자 페이지
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage")
);
const AdminUserManagementPage = lazy(() =>
  import("./pages/admin/AdminUserManagementPage")
);

// Private Route
const PrivateRoute = lazy(() => import("./components/auth/PrivateRoute"));
const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
const DealAcceptPage = lazy(() => import("./pages/DealAcceptPage"));
const BuyerPaymentPage = lazy(() => import("./pages/BuyerPaymentPage"));
//const PaymentProcessingPage = lazy(() => import("./pages/PaymentProcessingPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));

// 커스텀 테마 생성
const theme = createTheme({
  typography: {
    fontFamily: [
      "Wanted Sans Variable",
      "Wanted Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(","),
  },
  palette: {
    primary: {
      main: "#4A90E2",
    },
    background: {
      default: "#F7F8FA",
      paper: "#FFFFFF",
    },
    grey: {
      50: "#F7F8FA",
      100: "#EFF1F5",
      200: "#E5E8EB",
      300: "#D1D6DB",
    },
  },
  shape: {
    borderRadius: 12, // 동글동글한 느낌
  },
  shadows: [
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
    "none",
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "#F7F8FA",
            "& fieldset": {
              borderColor: "#E5E8EB",
            },
            "&:hover fieldset": {
              borderColor: "#D1D6DB",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#4A90E2",
              borderWidth: "1px",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #E5E8EB",
        },
        elevation1: {
          boxShadow: "none",
        },
        elevation2: {
          boxShadow: "none",
        },
        elevation3: {
          boxShadow: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #E5E8EB",
          borderRadius: 16,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
        },
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Suspense
              fallback={
                <LoadingSpinner fullPage message="페이지를 불러오는 중..." />
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/auth/kakao/callback"
                  element={<KakaoCallbackPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* 마이페이지 */}
                <Route
                  path="/mypage"
                  element={
                    <PrivateRoute>
                      <MyPageLayout />
                    </PrivateRoute>
                  }
                >
                  <Route
                    index
                    element={<Navigate to="/mypage/profile" replace />}
                  />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* 관리자 페이지 */}
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/users" replace />}
                />
                <Route
                  path="/admin/users"
                  element={
                    <PrivateRoute adminOnly={true}>
                      <AdminUserManagementPage />
                    </PrivateRoute>
                  }
                />

                <Route path="/deal/ticket/:ticket_id" element={<TicketDetailPage />} />
                <Route path="/chat/ticket/:ticket_id" element={<DealAcceptPage />} />
                <Route path="/buyer/payment/:payment_id" element={<BuyerPaymentPage />} />
                <Route path="/buyer/payment/:payment_id/result" element={<PaymentResultPage />} />
                <Route path="*" element={<Navigate to="/" />} />
                <Route path="/chat" element={<ChatListPage />} />
                <Route path="/chat/:chatroomId" element={<ChatRoomPage />} />
                <Route path="/sell" element={<TicketCreatePage />} />
                <Route path="/tickets" element={<TicketListPage />} />
                <Route path="/my" element={<MyTicketListPage />} />


              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
