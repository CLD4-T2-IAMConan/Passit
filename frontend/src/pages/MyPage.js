import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Grid,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../api/services/userService";

const MyPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, updateUser, logout } = useAuth();

  // 프로필 편집 상태
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    nickname: "",
    phone: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // 비밀번호 변경 상태
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // 계정 삭제 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        nickname: currentUser.nickname || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  // 프로필 수정 핸들러
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async () => {
    setProfileError("");
    setProfileSuccess("");
    setLoading(true);

    try {
      const updates = {};
      if (profileData.name !== currentUser.name) updates.name = profileData.name;
      if (profileData.nickname !== currentUser.nickname) updates.nickname = profileData.nickname;
      if (profileData.phone !== currentUser.phone) updates.phone = profileData.phone;

      if (Object.keys(updates).length === 0) {
        setProfileError("변경된 내용이 없습니다");
        setLoading(false);
        return;
      }

      const response = await userService.updateMe(updates);

      // Context의 user 정보 업데이트
      updateUser(response.data);

      setProfileSuccess("프로필이 성공적으로 업데이트되었습니다");
      setEditMode(false);

      // 성공 메시지 3초 후 자동 제거
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (error) {
      setProfileError(error.message || "프로필 업데이트에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      name: currentUser.name || "",
      nickname: currentUser.nickname || "",
      phone: currentUser.phone || "",
    });
    setEditMode(false);
    setProfileError("");
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("모든 필드를 입력해주세요");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("비밀번호는 최소 8자 이상이어야 합니다");
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess("비밀번호가 성공적으로 변경되었습니다");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // 성공 메시지 표시 후 다이얼로그 닫기
      setTimeout(() => {
        setPasswordDialogOpen(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error) {
      setPasswordError(error.message || "비밀번호 변경에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 계정 삭제 핸들러
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "탈퇴하기") {
      setDeleteError("탈퇴 확인 문구를 정확히 입력해주세요");
      return;
    }

    setLoading(true);

    try {
      await userService.deleteAccount();

      // 로그아웃 처리 및 홈으로 이동
      logout();
      navigate("/");
    } catch (error) {
      setDeleteError(error.message || "계정 삭제에 실패했습니다");
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <IconButton edge="start" color="inherit" onClick={() => navigate("/")} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
              마이페이지
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ mt: 12, mb: 6, px: { xs: 2, sm: 3 } }}>
        {/* 프로필 정보 섹션 */}
        <Paper sx={{ p: { xs: 3, sm: 4 }, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <PersonIcon sx={{ fontSize: 28, color: "primary.main", mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              프로필 정보
            </Typography>
          </Box>

          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileError}
            </Alert>
          )}

          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {profileSuccess}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일"
                value={currentUser?.email || ""}
                disabled
                helperText="이메일은 변경할 수 없습니다"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="이름"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                disabled={!editMode}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="닉네임"
                name="nickname"
                value={profileData.nickname}
                onChange={handleProfileChange}
                disabled={!editMode}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="전화번호"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                disabled={!editMode}
                placeholder="010-0000-0000"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            {!editMode ? (
              <Button variant="contained" onClick={() => setEditMode(true)} sx={{ px: 4 }}>
                수정하기
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={handleProfileSubmit}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  저장하기
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  취소
                </Button>
              </>
            )}
          </Box>
        </Paper>

        {/* 비밀번호 변경 섹션 */}
        <Paper sx={{ p: { xs: 3, sm: 4 }, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LockIcon sx={{ fontSize: 28, color: "primary.main", mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              비밀번호 변경
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            정기적인 비밀번호 변경으로 계정을 안전하게 보호하세요
          </Typography>

          <Button variant="outlined" onClick={() => setPasswordDialogOpen(true)} sx={{ px: 4 }}>
            비밀번호 변경
          </Button>
        </Paper>

        {/* 계정 삭제 섹션 */}
        <Paper sx={{ p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "error.light" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <DeleteIcon sx={{ fontSize: 28, color: "error.main", mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "error.main" }}>
              계정 삭제
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ px: 4 }}
          >
            계정 탈퇴
          </Button>
        </Paper>
      </Container>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
          setPasswordError("");
          setPasswordSuccess("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>비밀번호 변경</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          <TextField
            fullWidth
            type="password"
            label="현재 비밀번호"
            name="oldPassword"
            value={passwordData.oldPassword}
            onChange={handlePasswordChange}
            sx={{ mt: 2, mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            label="새 비밀번호"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            helperText="최소 8자 이상"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            label="새 비밀번호 확인"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setPasswordDialogOpen(false);
              setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
              setPasswordError("");
              setPasswordSuccess("");
            }}
            disabled={loading}
          >
            취소
          </Button>
          <Button onClick={handlePasswordSubmit} variant="contained" disabled={loading}>
            변경하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 계정 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteConfirmText("");
          setDeleteError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main" }}>계정 탈퇴</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              주의: 이 작업은 되돌릴 수 없습니다
            </Typography>
            <Typography variant="body2">• 모든 개인 정보가 삭제됩니다</Typography>
            <Typography variant="body2">• 거래 내역이 삭제됩니다</Typography>
            <Typography variant="body2">• 등록한 티켓이 삭제됩니다</Typography>
          </Alert>

          <Typography variant="body2" sx={{ mb: 2 }}>
            계속하려면 아래에 <strong>"탈퇴하기"</strong>를 입력하세요
          </Typography>

          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="탈퇴하기"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmText("");
              setDeleteError("");
            }}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={loading || deleteConfirmText !== "탈퇴하기"}
          >
            탈퇴하기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyPage;
