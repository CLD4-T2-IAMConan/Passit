import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  IconButton,
  InputAdornment,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { API_SERVICES } from "../config/apiConfig";
import { ENDPOINTS } from "../api/endpoints";

const RegisterForm = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(0); // 0: 가입방법 선택, 1: 이메일 인증, 2: 기본정보, 3: 비밀번호
  const [signupMethod, setSignupMethod] = useState(""); // "kakao" or "email"
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [timer, setTimer] = useState(0);

  // 비밀번호 강도 계산
  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (!password) return { label: "", strength: 0, color: "grey" };

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength < 30) return { label: "약함", strength, color: "error" };
    if (strength < 60) return { label: "보통", strength, color: "warning" };
    return { label: "강함", strength, color: "success" };
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // 타이머 효과
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // 인증 코드 발송
  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setError("이메일 주소를 입력해주세요");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("이메일 형식을 확인해주세요 (예: name@example.com)");
      return;
    }

    setSendingEmail(true);
    setError("");

    try {
      // TODO: API 연동 - 이메일 인증 코드 발송
      // await userService.sendVerificationCode(formData.email);

      // 임시: 성공 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEmailSent(true);
      setTimer(180); // 3분 타이머
      setError("");
      alert("인증 코드가 이메일로 발송되었습니다.");
    } catch (err) {
      setError(err.message || "인증 코드를 보내는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSendingEmail(false);
    }
  };

  // 인증 코드 검증
  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setError("인증 코드를 입력해주세요");
      return;
    }

    setVerifyingCode(true);
    setError("");

    try {
      // TODO: API 연동 - 인증 코드 검증
      // await userService.verifyCode(formData.email, formData.verificationCode);

      // 임시: 성공 시뮬레이션 (코드가 "123456"일 때 성공)
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (formData.verificationCode === "123456") {
        setEmailVerified(true);
        setTimer(0);
        setError("");
        // 다음 단계로 자동 이동
        setTimeout(() => setCurrentStep(2), 500);
      } else {
        setError("인증 코드가 일치하지 않아요. 다시 확인해주세요");
      }
    } catch (err) {
      setError(err.message || "인증 코드를 확인하는 중 문제가 발생했어요");
    } finally {
      setVerifyingCode(false);
    }
  };

  // 가입 방법 선택
  const handleSelectMethod = (method) => {
    setSignupMethod(method);
    if (method === "kakao") {
      // 카카오 로그인으로 리다이렉트
      // API_SERVICES.ACCOUNT는 이미 /api를 포함하고 있으므로 직접 사용
      window.location.href = `${API_SERVICES.ACCOUNT}${ENDPOINTS.AUTH.KAKAO}`;
    } else {
      // 이메일 가입 플로우 시작
      setCurrentStep(1);
    }
  };

  // 다음 단계로
  const handleNextStep = () => {
    setError("");

    if (currentStep === 1) {
      if (!emailVerified) {
        setError("이메일 인증을 먼저 완료해주세요");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.name.trim()) {
        setError("이름을 입력해주세요");
        return;
      }
      if (!formData.nickname.trim()) {
        setError("닉네임을 입력해주세요");
        return;
      }
      setCurrentStep(3);
    }
  };

  // 이전 단계로
  const handlePrevStep = () => {
    setError("");
    if (currentStep === 1) {
      // 첫 단계에서 이전을 누르면 가입 방법 선택으로
      setCurrentStep(0);
      setSignupMethod("");
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("서비스 이용을 위해 약관에 동의해주세요");
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호를 6자 이상으로 설정해주세요");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않아요. 다시 확인해주세요");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, verificationCode, ...userData } = formData;
      const result = await register(userData);

      if (result.success) {
        onRegisterSuccess(result.user);
      } else {
        setError(result.error || "회원가입 중 문제가 발생했어요. 잠시 후 다시 시도해주세요");
      }
    } catch (err) {
      setError(err.message || "회원가입 중 문제가 발생했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["이메일 인증", "기본 정보", "비밀번호 설정"];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 2.5 }, flexShrink: 0 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: "1.375rem", sm: "1.5rem", md: "1.75rem" },
          }}
        >
          회원가입
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", md: "0.938rem" } }}
        >
          {currentStep === 0
            ? "가입 방법을 선택해주세요"
            : "간편하게 가입하고 안전한 티켓 거래를 시작하세요"}
        </Typography>
      </Box>

      {/* Progress Stepper - 이메일 가입일 때만 표시 */}
      {currentStep > 0 && (
        <Box sx={{ mb: { xs: 2.5, md: 3 }, flexShrink: 0 }}>
          <Stepper activeStep={currentStep - 1} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      {/* Form */}
      <Box
        component="form"
        onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2.5, md: 3 },
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 0: 가입 방법 선택 */}
          {currentStep === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleSelectMethod("kakao")}
                sx={{
                  bgcolor: "#FEE500",
                  color: "#000000",
                  fontWeight: 600,
                  py: 2,
                  fontSize: "1rem",
                  "&:hover": {
                    bgcolor: "#FDD835",
                  },
                  textTransform: "none",
                }}
                startIcon={
                  <Box
                    component="img"
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMEMxMy45NzA2IDAgMTggMy4zODI3IDE4IDcuNTY3NjlDMTggMTEuNzUyNyAxMy45NzA2IDE1LjEzNTQgOSAxNS4xMzU0QzguMTI3MTggMTUuMTM1NCA3LjI5NDI1IDE1LjAyMDQgNi41MDk1NCAxNC44MDc4TDIuOTM5ODEgMTcuNDYwOUMyLjY2NDE4IDE3LjY5NDkgMi4yNzg0MSAxNy42NDgxIDIuMDU0NjkgMTcuMzU0OUMxLjk0MTE5IDE3LjIwODkgMS44ODM0OSAxNy4wMjI3IDEuODkxNTkgMTYuODMyM0wyLjExNDQyIDEyLjkxNTlDMC43ODU3MzggMTEuNjM0IDAgOS42OTc3NiAwIDcuNTY3NjlDMCAzLjM4MjcgNC4wMjk0NCAwIDkgMFoiIGZpbGw9IiMwMDAwMDAiLz4KPC9zdmc+"
                    alt="Kakao"
                    sx={{ width: 20, height: 20 }}
                  />
                }
              >
                카카오로 3초만에 시작하기
              </Button>

              <Divider>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                  또는
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => handleSelectMethod("email")}
                sx={{
                  py: 2,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                  },
                }}
              >
                이메일로 가입하기
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
                >
                  이미 계정이 있으신가요?{" "}
                  <Link
                    component="button"
                    type="button"
                    onClick={onSwitchToLogin}
                    underline="hover"
                    color="primary"
                    sx={{ fontWeight: 500 }}
                  >
                    로그인
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}

          {/* Step 1: 이메일 인증 */}
          {currentStep === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  이메일
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    placeholder="이메일@example.com"
                    disabled={emailVerified}
                    InputProps={{
                      endAdornment: emailVerified ? (
                        <InputAdornment position="end">
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                            ✓ 인증완료
                          </Typography>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleSendVerificationCode}
                    disabled={sendingEmail || emailVerified || timer > 0}
                    sx={{
                      minWidth: { xs: "80px", sm: "100px" },
                      fontSize: { xs: "0.813rem", sm: "0.875rem" },
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sendingEmail ? (
                      <CircularProgress size={20} />
                    ) : timer > 0 ? (
                      `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}`
                    ) : emailSent ? (
                      "재발송"
                    ) : (
                      "인증"
                    )}
                  </Button>
                </Box>
              </Box>

              {emailSent && !emailVerified && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    인증 코드
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      placeholder="인증 코드 6자리를 입력하세요"
                      inputProps={{ maxLength: 6 }}
                      autoFocus
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode || !formData.verificationCode}
                      sx={{
                        minWidth: { xs: "80px", sm: "100px" },
                        fontSize: { xs: "0.813rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                      }}
                    >
                      {verifyingCode ? <CircularProgress size={20} color="inherit" /> : "확인"}
                    </Button>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    테스트용 인증 코드: 123456
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Step 2: 기본 정보 */}
          {currentStep === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="이름"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="홍길동"
                helperText="실명을 입력해주세요"
                autoFocus
              />

              <TextField
                fullWidth
                label="닉네임"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="사용하실 닉네임을 입력하세요"
                helperText="다른 사용자에게 표시될 이름입니다"
              />
            </Box>
          )}

          {/* Step 3: 비밀번호 설정 */}
          {currentStep === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="비밀번호"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="비밀번호를 입력하세요"
                autoFocus
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {formData.password && (
                <Box sx={{ mt: -1.5 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
                  >
                    비밀번호 강도: {passwordStrength.label}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.strength}
                    color={passwordStrength.color}
                    sx={{ height: { xs: 5, sm: 6 }, borderRadius: 1 }}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                label="비밀번호 확인"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="비밀번호를 다시 입력하세요"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
                  >
                    <Link href="#" underline="hover" color="primary">
                      이용약관
                    </Link>{" "}
                    및{" "}
                    <Link href="#" underline="hover" color="primary">
                      개인정보처리방침
                    </Link>
                    에 동의합니다
                  </Typography>
                }
                sx={{ alignItems: "center", ml: -0.5 }}
              />
            </Box>
          )}
        </Box>

        {/* 버튼 영역 - Step 0이 아닐 때만 표시 */}
        {currentStep > 0 && (
          <>
            <Box sx={{ display: "flex", gap: 2, mt: "auto" }}>
              {currentStep >= 1 && (
                <Button
                  variant="outlined"
                  onClick={handlePrevStep}
                  startIcon={<ArrowBack />}
                  sx={{
                    minWidth: { xs: 90, sm: 100 },
                    py: { xs: 1.25, sm: 1.5 },
                  }}
                >
                  이전
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && !emailVerified}
                  sx={{
                    py: { xs: 1.25, sm: 1.5 },
                    fontWeight: 600,
                    fontSize: { xs: "0.938rem", sm: "1rem" },
                  }}
                >
                  다음
                </Button>
              ) : (
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: { xs: 1.25, sm: 1.5 },
                    fontWeight: 600,
                    fontSize: { xs: "0.938rem", sm: "1rem" },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "회원가입"}
                </Button>
              )}
            </Box>

            <Box sx={{ textAlign: "center", pt: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
              >
                이미 계정이 있으신가요?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={onSwitchToLogin}
                  underline="hover"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                >
                  로그인
                </Link>
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default RegisterForm;
