import React from "react";
import { TextField, TextFieldProps, Box, Typography } from "@mui/material";

interface FormFieldProps extends Omit<TextFieldProps, "label"> {
  label?: string;
  showLabel?: boolean;
  errorMessage?: string;
}

/**
 * 재사용 가능한 폼 필드 컴포넌트
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  showLabel = false,
  errorMessage,
  helperText,
  ...textFieldProps
}) => {
  return (
    <Box>
      {showLabel && label && (
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
        label={!showLabel ? label : undefined}
        error={!!errorMessage || textFieldProps.error}
        helperText={errorMessage || helperText}
        fullWidth
        variant="outlined"
        aria-label={label || textFieldProps.placeholder}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? `${textFieldProps.name}-error` : undefined}
      />
    </Box>
  );
};
