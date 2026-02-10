import React, { useState } from 'react';
import { Container, Typography, Button, Box, TextField, Paper, Alert } from '@mui/material';
import { Lock, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// 使用环境变量或默认值作为 API 基础 URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || '登录失败');
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
            <Lock size={48} color="#1976d2" />
            <Typography variant="h5" className="upload-area-title" gutterBottom>
              用户登录
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
              sx={{ mb: 3 }}
              InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<LogIn size={16} />}
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              还没有账户？{' '}
              <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                立即注册
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Container>
  );
}

export default Login;