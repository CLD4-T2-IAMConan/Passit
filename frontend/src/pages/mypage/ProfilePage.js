import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../contexts/AuthContext";
import { userService } from "../../api/services/userService";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: currentUser, updateUser, logout } = useAuth();

  // 사용자 정보 상태 (서버에서 가져온 전체 정보)
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  // 소셜 로그인 사용자 여부 확인 (서버에서 가져온 정보 우선)
  const isSocialUser = userInfo?.provider != null || currentUser?.provider != null;

  // 비밀번호 확인 상태 (소셜 로그인 사용자는 스킵)
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  // 서버에서 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoadingUserInfo(true);
        const response = await userService.getMe();
        const fullUserInfo = response.data;
        setUserInfo(fullUserInfo);
        
        // 소셜 로그인 사용자는 비밀번호 확인 스킵
        if (fullUserInfo.provider != null) {
          setPasswordVerified(true);
        }
        
        // 프로필 데이터 설정
        setProfileData({
          name: fullUserInfo.name || "",
          nickname: fullUserInfo.nickname || "",
          phone: fullUserInfo.phone || "",
        });
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoadingUserInfo(false);
      }
    };

    fetchUserInfo();
  }, []);

  // 비밀번호 확인 처리
  const handlePasswordVerify = async () => {
    if (!verifyPassword) {
      setVerifyError("비밀번호를 입력해주세요");
      return;
    }

    setVerifying(true);
    setVerifyError("");

    try {
      await userService.verifyPassword(verifyPassword);

      setPasswordVerified(true);
      setVerifyPassword("");
    } catch (error) {
      console.error("비밀번호 확인 에러:", error);
      setVerifyError(error.message || "비밀번호가 일치하지 않습니다");
    } finally {
      setVerifying(false);
    }
  };

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
      const displayUser = userInfo || currentUser;
      const updates = {};
      if (profileData.name !== displayUser?.name) updates.name = profileData.name;
      if (profileData.nickname !== displayUser?.nickname) updates.nickname = profileData.nickname;
      if (profileData.phone !== displayUser?.phone) updates.phone = profileData.phone;

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
    const displayUser = userInfo || currentUser;
    setProfileData({
      name: displayUser?.name || "",
      nickname: displayUser?.nickname || "",
      phone: displayUser?.phone || "",
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

    // 소셜 로그인 사용자는 기존 비밀번호 확인 불필요
    if (isSocialUser) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError("모든 필드를 입력해주세요");
        return;
      }
    } else {
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError("모든 필드를 입력해주세요");
        return;
      }
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
      if (isSocialUser) {
        // 소셜 로그인 사용자: 비밀번호 설정 API 사용
        await userService.setPassword({
          newPassword: passwordData.newPassword,
        });
      } else {
        // 일반 사용자: 비밀번호 변경 API 사용
        await userService.changePassword({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        });
      }

      setPasswordSuccess(
        isSocialUser
          ? "비밀번호가 성공적으로 설정되었습니다"
          : "비밀번호가 성공적으로 변경되었습니다"
      );
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

  // 사용자 정보 로딩 중
  if (loadingUserInfo) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  // 비밀번호 미확인 시 확인 다이얼로그 표시
  if (!passwordVerified) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "400px",
          pt: 4,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 500, width: "100%" }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <LockIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              본인 확인
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSocialUser
                ? "소셜 로그인 사용자는 비밀번호 확인이 필요하지 않습니다"
                : "회원정보 수정을 위해 비밀번호를 입력해주세요"}
            </Typography>
          </Box>

          {verifyError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {verifyError}
            </Alert>
          )}

          <TextField
            fullWidth
            type="password"
            label="비밀번호"
            value={verifyPassword}
            onChange={(e) => setVerifyPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handlePasswordVerify();
              }
            }}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handlePasswordVerify}
            disabled={verifying}
            sx={{ py: 1.5 }}
          >
            확인
          </Button>
        </Paper>
      </Box>
    );
  }

  // 비밀번호 확인 완료 후 회원정보 관리 화면
  return (
    <Box>
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

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            fullWidth
            label="이메일"
            value={(userInfo || currentUser)?.email || ""}
            disabled
            helperText="이메일은 변경할 수 없습니다"
          />

          <TextField
            fullWidth
            label="이름"
            name="name"
            value={profileData.name}
            onChange={handleProfileChange}
            disabled={!editMode}
          />

          <TextField
            fullWidth
            label="닉네임"
            name="nickname"
            value={profileData.nickname}
            onChange={handleProfileChange}
            disabled={!editMode}
          />

          <TextField
            fullWidth
            label="전화번호"
            name="phone"
            value={profileData.phone}
            onChange={handleProfileChange}
            disabled={!editMode}
            placeholder="010-0000-0000"
          />
        </Box>

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          {!editMode ? (
            <Button
              variant="contained"
              onClick={() => setEditMode(true)}
              sx={{ px: 4 }}
            >
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
          {isSocialUser
            ? "비밀번호를 설정하면 이메일과 비밀번호로도 로그인할 수 있습니다"
            : "정기적인 비밀번호 변경으로 계정을 안전하게 보호하세요"}
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setPasswordDialogOpen(true)}
          sx={{ px: 4 }}
        >
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
        <DialogTitle>
          {isSocialUser ? "비밀번호 설정" : "비밀번호 변경"}
        </DialogTitle>
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

          {!isSocialUser && (
            <TextField
              fullWidth
              type="password"
              label="현재 비밀번호"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              sx={{ mt: 2, mb: 2 }}
            />
          )}

          {isSocialUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
              비밀번호를 설정하면 이메일과 비밀번호로도 로그인할 수 있습니다.
            </Typography>
          )}

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
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            disabled={loading}
          >
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
            <Typography variant="body2">
              • 모든 개인 정보가 삭제됩니다
            </Typography>
            <Typography variant="body2">
              • 거래 내역이 삭제됩니다
            </Typography>
            <Typography variant="body2">
              • 등록한 티켓이 삭제됩니다
            </Typography>
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

export default ProfilePage;
