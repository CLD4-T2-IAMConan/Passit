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
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import userService from "../services/userService";

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: 이메일, 2: 인증코드, 3: 새 비밀번호
  const [formData, setFormData] = useState({
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      await userService.sendPasswordResetCode(formData.email);

      setEmailSent(true);
      setTimer(180); // 3분 타이머
      setError("");
      alert("인증 코드가 이메일로 발송되었습니다.");
      setCurrentStep(2);
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
      await userService.verifyPasswordResetCode(formData.email, formData.verificationCode);

      setEmailVerified(true);
      setTimer(0);
      setError("");
      // 다음 단계로 자동 이동
      setTimeout(() => setCurrentStep(3), 500);
    } catch (err) {
      setError(err.message || "인증 코드를 확인하는 중 문제가 발생했어요");
    } finally {
      setVerifyingCode(false);
    }
  };

  // 비밀번호 변경
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      await userService.resetPassword(formData.email, formData.password);

      alert("비밀번호가 변경되었습니다. 로그인해주세요.");
      navigate("/auth");
    } catch (err) {
      setError(err.message || "비밀번호 변경 중 문제가 발생했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = ["이메일 확인", "인증 코드", "비밀번호 변경"];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
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
          비밀번호 찾기
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", md: "0.938rem" } }}
        >
          가입 시 입력한 이메일로 비밀번호를 재설정하세요
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Box sx={{ mb: { xs: 2.5, md: 3 }, flexShrink: 0 }}>
        <Stepper activeStep={currentStep - 1} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2.5, md: 3 },
          flex: 1,
          justifyContent: "flex-start",
        }}
      >
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: 이메일 입력 */}
          {currentStep === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  이메일
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  placeholder="가입 시 사용한 이메일을 입력하세요"
                  autoFocus
                />
              </Box>
            </Box>
          )}

          {/* Step 2: 인증 코드 입력 */}
          {currentStep === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {formData.email}으로 발송되었습니다
                  </Typography>
                  {timer > 0 && (
                    <Typography variant="caption" color="primary">
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  테스트용 인증 코드: 123456
                </Typography>
              </Box>
            </Box>
          )}

          {/* Step 3: 새 비밀번호 설정 */}
          {currentStep === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="새 비밀번호"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
                placeholder="새 비밀번호를 입력하세요"
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
            </Box>
          )}
        </Box>

        {/* 버튼 영역 */}
        <Box sx={{ display: "flex", gap: 2, mt: "auto" }}>
          {currentStep > 1 && (
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

          {currentStep === 1 ? (
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendVerificationCode}
              disabled={sendingEmail || !formData.email}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontWeight: 600,
                fontSize: { xs: "0.938rem", sm: "1rem" },
              }}
            >
              {sendingEmail ? <CircularProgress size={24} color="inherit" /> : "인증 코드 받기"}
            </Button>
          ) : currentStep === 2 ? (
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyCode}
              disabled={verifyingCode || !formData.verificationCode}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontWeight: 600,
                fontSize: { xs: "0.938rem", sm: "1rem" },
              }}
            >
              {verifyingCode ? <CircularProgress size={24} color="inherit" /> : "다음"}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : "비밀번호 변경"}
            </Button>
          )}
        </Box>

        <Box sx={{ textAlign: "center", pt: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
          >
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/auth")}
              underline="hover"
              color="primary"
              sx={{ fontWeight: 500 }}
            >
              로그인으로 돌아가기
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPasswordForm;
