import React, { useState } from 'react';
import { Container, Typography, Button, Box, TextField, Paper, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// 使用环境变量或默认值作为 API 基础 URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
API_BASE_URL = 'http://106.14.163.150/api';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'parent' // 默认角色为家长
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // 从AuthContext获取login方法

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || '注册失败');
      }

      // 使用AuthContext的login方法更新用户状态
      login(data.user, data.token);

      // 导航到主页，稍作延迟以确保状态更新
      setTimeout(() => {
        navigate('/');
      }, 10);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className="app-main-container">
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Paper className="upload-area-container" sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <UserPlus size={48} color="#1976d2" />
            <Typography variant="h5" className="upload-area-title" gutterBottom>
              用户注册
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="用户名"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
            />
            <TextField
              fullWidth
              label="邮箱"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
            />
            <TextField
              fullWidth
              label="密码"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
            />
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>角色</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="角色"
                onChange={handleChange}
              >
                <MenuItem value="student">学生</MenuItem>
                <MenuItem value="parent">家长</MenuItem>
                <MenuItem value="teacher">教师</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<UserPlus size={16} />}
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              已有账户？{' '}
              <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                立即登录
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Container>
  );
}

export default Register;