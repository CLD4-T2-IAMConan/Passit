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
  Paper,
  Chip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from "@mui/icons-material";
import { categoryService } from "../../api/services/categoryService";
import AdminLayout from "../../layouts/AdminLayout";

const AdminCategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: "",
    parentId: null,
  });

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getAllCategories(true);
      if (response.success) {
        setCategories(response.data);
        // 평면화된 목록도 생성 (부모 선택용)
        setFlatCategories(flattenCategories(response.data));
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "카테고리 목록을 불러오는데 실패했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  // 계층 구조를 평면화 (부모 선택 옵션용)
  const flattenCategories = (categories, level = 0) => {
    let result = [];
    categories.forEach((cat) => {
      result.push({ ...cat, _level: level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 생성 모달 열기
  const handleCreateOpen = () => {
    setFormData({ name: "", parentId: null });
    setCreateModalOpen(true);
  };

  // 수정 모달 열기
  const handleEditOpen = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId || null,
    });
    setEditModalOpen(true);
  };

  // 삭제 확인 모달 열기
  const handleDeleteOpen = (category) => {
    setSelectedCategory(category);
    setDeleteConfirmOpen(true);
  };

  // 카테고리 생성
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError("카테고리 이름을 입력해주세요");
      return;
    }

    try {
      const requestData = {
        name: formData.name.trim(),
        parentId: formData.parentId || null,
      };
      const response = await categoryService.createCategory(requestData);
      if (response.success) {
        setSuccess("카테고리가 생성되었습니다");
        setCreateModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "카테고리 생성에 실패했습니다");
    }
  };

  // 카테고리 수정
  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      setError("카테고리 이름을 입력해주세요");
      return;
    }

    try {
      const requestData = {
        name: formData.name.trim(),
        parentId: formData.parentId || null,
      };
      const response = await categoryService.updateCategory(selectedCategory.id, requestData);
      if (response.success) {
        setSuccess("카테고리가 수정되었습니다");
        setEditModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "카테고리 수정에 실패했습니다");
    }
  };

  // 카테고리 삭제
  const handleDelete = async () => {
    try {
      const response = await categoryService.deleteCategory(selectedCategory.id);
      if (response.success) {
        setSuccess("카테고리가 삭제되었습니다");
        setDeleteConfirmOpen(false);
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "카테고리 삭제에 실패했습니다");
    }
  };

  // 하위 카테고리 확인
  const hasChildren = (category) => {
    return category.children && category.children.length > 0;
  };

  // 수정 시 선택 가능한 부모 목록 (순환 참조 방지)
  const getAvailableParents = (currentCategory) => {
    return flatCategories.filter(
      (cat) => cat.id !== currentCategory.id && !isDescendant(cat, currentCategory) && cat.depth < 3 // 소분류는 부모가 될 수 없음
    );
  };

  // 자손인지 확인
  const isDescendant = (category, target) => {
    if (category.id === target.id) return true;
    if (category.children) {
      return category.children.some((child) => isDescendant(child, target));
    }
    return false;
  };

  // 깊이별 색상
  const getDepthColor = (depth) => {
    switch (depth) {
      case 1:
        return "primary";
      case 2:
        return "secondary";
      case 3:
        return "default";
      default:
        return "default";
    }
  };

  // 깊이별 라벨
  const getDepthLabel = (depth) => {
    switch (depth) {
      case 1:
        return "대분류";
      case 2:
        return "중분류";
      case 3:
        return "소분류";
      default:
        return "";
    }
  };

  // 카테고리 행 렌더링 (재귀)
  const renderCategoryRow = (category, level = 0) => {
    const indent = level * 24;
    const canDelete = !hasChildren(category);

    return (
      <React.Fragment key={category.id}>
        <TableRow>
          <TableCell sx={{ pl: `${indent + 24}px` }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {level > 0 && (
                <SubdirectoryArrowRightIcon fontSize="small" sx={{ color: "text.secondary" }} />
              )}
              <Typography variant="body2">{category.name}</Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ pl: 2 }}>
            <Chip
              label={getDepthLabel(category.depth)}
              size="small"
              color={getDepthColor(category.depth)}
            />
          </TableCell>
          <TableCell sx={{ pl: 2 }}>{category.parentName || "-"}</TableCell>
          <TableCell align="right" sx={{ pr: 2 }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Tooltip title="수정">
                <IconButton size="small" onClick={() => handleEditOpen(category)} color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={canDelete ? "삭제" : "하위 카테고리가 있어 삭제할 수 없습니다"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteOpen(category)}
                    color="error"
                    disabled={!canDelete}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </TableCell>
        </TableRow>
        {category.children && category.children.map((child) => renderCategoryRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // 부모 선택 옵션 렌더링 (재귀)
  const renderParentOptions = (categories, level = 0, excludeCategory = null) => {
    let options = [];
    categories.forEach((cat) => {
      // 순환 참조 방지: 자기 자신과 자손은 제외
      const isExcluded =
        excludeCategory && (cat.id === excludeCategory.id || isDescendant(cat, excludeCategory));

      if (!isExcluded && cat.depth < 3) {
        options.push(
          <MenuItem key={cat.id} value={cat.id}>
            {"　".repeat(level)}
            {cat.name} ({getDepthLabel(cat.depth)})
          </MenuItem>
        );
      }
      if (cat.children && cat.children.length > 0) {
        options = options.concat(renderParentOptions(cat.children, level + 1, excludeCategory));
      }
    });
    return options;
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" fontWeight="bold">
              카테고리 관리
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>
              카테고리 추가
            </Button>
          </Stack>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>카테고리명</TableCell>
                <TableCell sx={{ pl: 2 }}>분류</TableCell>
                <TableCell sx={{ pl: 2 }}>부모 카테고리</TableCell>
                <TableCell align="right" sx={{ pr: 2 }}>
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography>로딩 중...</Typography>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">등록된 카테고리가 없습니다</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => renderCategoryRow(category, 0))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 생성 모달 */}
        <Dialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>카테고리 생성</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="카테고리 이름"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>부모 카테고리 (선택)</InputLabel>
                <Select
                  value={formData.parentId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value || null,
                    })
                  }
                  label="부모 카테고리 (선택)"
                >
                  <MenuItem value="">없음 (대분류)</MenuItem>
                  {renderParentOptions(categories)}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateModalOpen(false)}>취소</Button>
            <Button onClick={handleCreate} variant="contained">
              생성
            </Button>
          </DialogActions>
        </Dialog>

        {/* 수정 모달 */}
        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>카테고리 수정</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="카테고리 이름"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>부모 카테고리 (선택)</InputLabel>
                <Select
                  value={formData.parentId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value || null,
                    })
                  }
                  label="부모 카테고리 (선택)"
                >
                  <MenuItem value="">없음 (대분류)</MenuItem>
                  {renderParentOptions(categories, 0, selectedCategory)}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)}>취소</Button>
            <Button onClick={handleUpdate} variant="contained">
              수정
            </Button>
          </DialogActions>
        </Dialog>

        {/* 삭제 확인 모달 */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>카테고리 삭제</DialogTitle>
          <DialogContent>
            <Typography>
              정말로 "{selectedCategory?.name}" 카테고리를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>취소</Button>
            <Button onClick={handleDelete} variant="contained" color="error">
              삭제
            </Button>
          </DialogActions>
        </Dialog>

        {/* 알림 */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
};

export default AdminCategoryManagementPage;
