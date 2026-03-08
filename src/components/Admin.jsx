import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Alert, Snackbar } from '@mui/material';
import { Users, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLE_LABELS } from '../types/user';
import { LLM_MODELS } from '../utils/constants';

function Admin() {
  const { user: currentUser, updateUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [editedUser, setEditedUser] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUser || currentUser.role !== 'admin') return;
      
      try {
        setLoading(true);
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiBaseUrl}/users`, {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          throw new Error('加载用户列表失败');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser]);

  // 检查用户是否是管理员
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            权限不足
          </Typography>
          <Typography variant="body1">
            只有管理员才能访问此页面
          </Typography>
        </Paper>
      </Container>
    );
  }

  // 处理编辑用户
  const handleEditUser = (user) => {
    setEditedUser({ ...user });
    setEditDialog({ open: true, user });
  };

  // 处理保存用户
  const handleSaveUser = async () => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const userId = editedUser._id || editedUser.id;
      const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify(editedUser)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => {
          const currentUserId = u._id || u.id;
          return currentUserId === userId ? updatedUser : u;
        }));
        
        const currentUserId = currentUser?._id || currentUser?.id;
        if (currentUserId === userId) {
          updateUser(updatedUser);
        }
        
        setEditDialog({ open: false, user: null });
        setSnackbar({ open: true, message: '用户信息更新成功', severity: 'success' });
      } else {
        throw new Error('更新用户失败');
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  // 处理删除用户
  const handleDeleteUser = async (userId) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        if (response.ok) {
          setUsers(users.filter(u => u._id !== userId && u.id !== userId));
          setSnackbar({ open: true, message: '用户删除成功', severity: 'success' });
        } else {
          throw new Error('删除用户失败');
        }
      } catch (err) {
        setSnackbar({ open: true, message: err.message, severity: 'error' });
      }
    }
  };

  // 处理模型权限变更
  const handleModelChange = (model, checked) => {
    setEditedUser(prev => {
      const currentModels = prev.allowedModels || [];
      if (checked) {
        return {
          ...prev,
          allowedModels: [...new Set([...currentModels, model])]
        };
      } else {
        return {
          ...prev,
          allowedModels: currentModels.filter(m => m !== model)
        };
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            <Users size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            用户管理
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>用户名</TableCell>
                <TableCell>邮箱</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>允许的模型</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id || user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{USER_ROLE_LABELS[user.role] || user.role}</TableCell>
                  <TableCell>
                    {user.allowedModels?.map(model => {
                      const modelInfo = LLM_MODELS.find(m => m.value === model);
                      return modelInfo ? (
                        <Box
                          key={model}
                          sx={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            margin: '2px',
                            borderRadius: '4px',
                            backgroundColor: modelInfo.color + '20',
                            color: modelInfo.color
                          }}
                        >
                          {modelInfo.label}
                        </Box>
                      ) : model;
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit size={16} />}
                      onClick={() => handleEditUser(user)}
                      sx={{ mr: 1 }}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Trash2 size={16} />}
                      color="error"
                      onClick={() => handleDeleteUser(user._id || user.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 编辑用户对话框 */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, user: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit size={20} />
            编辑用户
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="用户名"
              value={editedUser.username || ''}
              onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="邮箱"
              value={editedUser.email || ''}
              onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>角色</InputLabel>
              <Select
                value={editedUser.role || 'parent'}
                label="角色"
                onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
              >
                {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
              允许的大模型：
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {LLM_MODELS.map((model) => (
                <FormControlLabel
                  key={model.value}
                  control={
                    <Checkbox
                      checked={(editedUser.allowedModels || []).includes(model.value)}
                      onChange={(e) => handleModelChange(model.value, e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: model.color
                        }}
                      />
                      {model.label}
                    </Box>
                  }
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>
            取消
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={16} />}
            onClick={handleSaveUser}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          {snackbar.severity === 'success' ? (
            <Save size={20} />
          ) : (
            <X size={20} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {snackbar.message}
          </Typography>
        </Box>
      </Snackbar>
    </Container>
  );
}

export default Admin;