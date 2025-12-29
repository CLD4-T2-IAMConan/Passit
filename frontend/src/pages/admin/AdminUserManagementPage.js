import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { adminService } from "../../api/services/adminService";
import AdminLayout from "../../layouts/AdminLayout";

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 검색 및 필터링
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // 정렬
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");

  // 회원 상세 모달
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 수정할 데이터
  const [editData, setEditData] = useState({
    name: "",
    nickname: "",
    profileImageUrl: "",
  });

  // 회원 목록 조회
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.searchUsers({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page,
        size: rowsPerPage,
        sortBy,
        sortDirection,
      });

      if (response.success) {
        setUsers(response.data.content);
        setTotalElements(response.data.totalElements);
      }
    } catch (err) {
      setError(err.response?.data?.message || "회원 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, statusFilter, sortBy, sortDirection]);

  // 검색 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // 페이지 변경
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 회원 상세 보기
  const handleViewUser = async (userId) => {
    try {
      const response = await adminService.getUserById(userId);
      if (response.success) {
        setSelectedUser(response.data);
        setEditData({
          name: response.data.name,
          nickname: response.data.nickname || "",
          profileImageUrl: response.data.profileImageUrl || "",
        });
        setDetailModalOpen(true);
        setEditMode(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "회원 정보를 불러오는데 실패했습니다");
    }
  };

  // 회원 정보 수정
  const handleUpdateUser = async () => {
    try {
      const response = await adminService.updateUser(selectedUser.userId, editData);
      if (response.success) {
        setSuccess("회원 정보가 수정되었습니다");
        setDetailModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || "회원 정보 수정에 실패했습니다");
    }
  };

  // 회원 정지
  const handleSuspendUser = async (userId) => {
    if (!window.confirm("이 회원을 정지하시겠습니까?")) return;

    try {
      const response = await adminService.suspendUser(userId);
      if (response.success) {
        setSuccess("회원이 정지되었습니다");
        fetchUsers();
        if (selectedUser?.userId === userId) {
          setDetailModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "회원 정지에 실패했습니다");
    }
  };

  // 회원 활성화
  const handleActivateUser = async (userId) => {
    try {
      const response = await adminService.activateUser(userId);
      if (response.success) {
        setSuccess("회원이 활성화되었습니다");
        fetchUsers();
        if (selectedUser?.userId === userId) {
          setDetailModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "회원 활성화에 실패했습니다");
    }
  };

  // 회원 삭제
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("이 회원을 삭제하시겠습니까? (소프트 삭제)")) return;

    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        setSuccess("회원이 삭제되었습니다");
        fetchUsers();
        if (selectedUser?.userId === userId) {
          setDetailModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "회원 삭제에 실패했습니다");
    }
  };

  // 상태 칩 컬러
  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "SUSPENDED":
        return "warning";
      case "DELETED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          회원 관리
        </Typography>

        {/* 검색 및 필터 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="검색 (이름, 이메일, 닉네임)"
              variant="outlined"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="상태"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="ACTIVE">활성</MenuItem>
                <MenuItem value="SUSPENDED">정지</MenuItem>
                <MenuItem value="DELETED">삭제</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleSearch} sx={{ height: 56 }}>
              검색
            </Button>
          </Stack>
        </Paper>

        {/* 회원 목록 테이블 */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>ID</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>닉네임</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    회원이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.userId} hover>
                    <TableCell>{user.userId}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.nickname || "-"}</TableCell>
                    <TableCell>
                      <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewUser(user.userId)}
                        title="상세보기"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {user.status === "ACTIVE" && (
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleSuspendUser(user.userId)}
                          title="정지"
                        >
                          <BlockIcon />
                        </IconButton>
                      )}
                      {user.status === "SUSPENDED" && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleActivateUser(user.userId)}
                          title="활성화"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteUser(user.userId)}
                        title="삭제"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 행 수:"
          />
        </TableContainer>

        {/* 회원 상세/수정 모달 */}
        <Dialog
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editMode ? "회원 정보 수정" : "회원 상세 정보"}</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField label="이메일" value={selectedUser.email} disabled fullWidth />
                {editMode ? (
                  <>
                    <TextField
                      label="이름"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="닉네임"
                      value={editData.nickname}
                      onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="프로필 이미지 URL"
                      value={editData.profileImageUrl}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          profileImageUrl: e.target.value,
                        })
                      }
                      fullWidth
                    />
                  </>
                ) : (
                  <>
                    <TextField label="이름" value={selectedUser.name} disabled fullWidth />
                    <TextField
                      label="닉네임"
                      value={selectedUser.nickname || "-"}
                      disabled
                      fullWidth
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        상태
                      </Typography>
                      <Chip
                        label={selectedUser.status}
                        color={getStatusColor(selectedUser.status)}
                      />
                    </Box>
                    <TextField
                      label="가입일"
                      value={new Date(selectedUser.createdAt).toLocaleString()}
                      disabled
                      fullWidth
                    />
                    <TextField
                      label="최종 수정일"
                      value={new Date(selectedUser.updatedAt).toLocaleString()}
                      disabled
                      fullWidth
                    />
                    {selectedUser.lastLoginAt && (
                      <TextField
                        label="마지막 접속일"
                        value={new Date(selectedUser.lastLoginAt).toLocaleString()}
                        disabled
                        fullWidth
                      />
                    )}
                  </>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>취소</Button>
                <Button variant="contained" onClick={handleUpdateUser}>
                  저장
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setDetailModalOpen(false)}>닫기</Button>
                <Button variant="contained" onClick={() => setEditMode(true)}>
                  수정
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* 성공 메시지 */}
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        {/* 에러 메시지 */}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
};

export default AdminUserManagementPage;
