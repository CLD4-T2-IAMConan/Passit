import React, { useState } from "react";
import {
  TextField,
  TextFieldProps,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { usePasswordStrength } from "../../hooks/usePasswordStrength";

interface PasswordFieldProps extends Omit<TextFieldProps, "type" | "label"> {
  label?: string;
  showLabel?: boolean;
  showStrengthIndicator?: boolean;
  errorMessage?: string;
}

/**
 * 비밀번호 입력 필드 컴포넌트 (강도 표시 및 토글 기능 포함)
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({
  label = "비밀번호",
  showLabel = false,
  showStrengthIndicator = false,
  errorMessage,
  value = "",
  helperText,
  ...textFieldProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = usePasswordStrength(String(value));

  return (
    <Box>
      {showLabel && (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 1 }}
          component="label"
          htmlFor={textFieldProps.name}
        >
          {label}
        </Typography>
      )}

      <TextField
        {...textFieldProps}
        type={showPassword ? "text" : "password"}
        label={!showLabel ? label : undefined}
        value={value}
        error={!!errorMessage || textFieldProps.error}
        helperText={errorMessage || helperText}
        fullWidth
        variant="outlined"
        aria-label={label}
        aria-invalid={!!errorMessage}
        InputProps={{
          ...textFieldProps.InputProps,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                tabIndex={-1}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {showStrengthIndicator && value ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
            aria-live="polite"
          >
            비밀번호 강도: {passwordStrength.label}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={passwordStrength.strength}
            color={passwordStrength.color as "error" | "warning" | "success"}
            sx={{ height: { xs: 5, sm: 6 }, borderRadius: 1 }}
            aria-label={`비밀번호 강도 ${passwordStrength.strength}%`}
          />
        </Box>
      ) : null}
    </Box>
  );
};
