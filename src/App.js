import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Container, CircularProgress, Alert, Box } from '@mui/material';
import { LogOut, BookOpen } from 'lucide-react';
import Home from './components/Home';
import Upload from './components/Upload/index';
import QuestionDetail from './components/QuestionDetail';
import Generator from './components/Generator';
import Printer from './components/Printer';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UploadProvider } from './contexts/UploadContext';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://106.14.163.150:5001/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// 主应用组件
const MainApp = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  // 获取所有问题
  const fetchQuestions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // 只有当用户登录后才获取问题数据
      if (!token) {
        setQuestions([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        'x-auth-token': token
      };

      const response = await fetch(`${API_BASE_URL}/questions`, {
        headers
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setQuestions(data.questions || []);
      setError(null);
    } catch (err) {
      console.error('获取问题失败:', err);
      setError('获取问题失败，请检查后端服务是否运行');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // 添加问题
  const addQuestion = async (newQuestion) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(newQuestion),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('请先登录');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedQuestion = await response.json();
      setQuestions([addedQuestion, ...questions]);
      return addedQuestion;
    } catch (err) {
      console.error('添加问题失败:', err);
      throw err;
    }
  };

  // 更新问题
  const updateQuestion = async (id, updatedQuestion) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updatedQuestion),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('请先登录');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updated = await response.json();
      setQuestions(questions.map(q => q._id === id ? updated : q));
      return updated;
    } catch (err) {
      console.error('更新问题失败:', err);
      throw err;
    }
  };

  // 删除问题
  const deleteQuestion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('请先登录');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error('删除问题失败:', err);
      throw err;
    }
  };

  // 生成类似题目
  const generateSimilar = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/questions/${id}/generate-similar`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error('请先登录');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedQuestion = await response.json();
      setQuestions(questions.map(q => q._id === id ? updatedQuestion : q));
      return updatedQuestion;
    } catch (err) {
      console.error('生成类似题目失败:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [user, fetchQuestions]);

  // 渲染导航栏
  const renderNavbar = () => (
    <AppBar position="static">
      <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <BookOpen style={{ verticalAlign: 'middle', marginRight: '12px' }} />
              小学生易错题管理系统
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              智能识别、归纳、生成类似题目，助力孩子学习成长
            </Typography>
          </Box>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                欢迎, {user.username} ({user.role})
              </Typography>
              <Button color="inherit" component={Link} to="/">首页</Button>
              <Button color="inherit" component={Link} to="/upload">上传</Button>
              <Button color="inherit" component={Link} to="/generator">生成题目</Button>
              <Button color="inherit" component={Link} to="/printer">打印</Button>
              <Button color="inherit" component={Link} to="/statistics">统计分析</Button>
              <Button color="inherit" component={Link} to="/settings">设置</Button>
              <Button
                color="inherit"
                onClick={logout}
                startIcon={<LogOut size={16} />}
              >
                登出
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={Link} to="/login">登录</Button>
              <Button color="inherit" component={Link} to="/register">注册</Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );

  // 渲染路由
  const renderRoutes = () => {
    if (!user) {
      return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      );
    }

    return (
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Home questions={questions} deleteQuestion={deleteQuestion} />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <Upload addQuestion={addQuestion} />
          </ProtectedRoute>
        } />
        <Route path="/question/:id" element={
          <ProtectedRoute>
            <QuestionDetail questions={questions} updateQuestion={updateQuestion} generateSimilar={generateSimilar} />
          </ProtectedRoute>
        } />
        <Route path="/generator" element={
          <ProtectedRoute>
            <Generator />
          </ProtectedRoute>
        } />
        <Route path="/printer" element={
          <ProtectedRoute>
            <Printer questions={questions} />
          </ProtectedRoute>
        } />
        <Route path="/statistics" element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  };

  // 登录状态下显示加载状态
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // 登录状态下显示错误信息
  if (error && user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <p>请确保后端服务正在运行 (npm start 在 server 目录)</p>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {renderNavbar()}
        <Container maxWidth="lg" sx={{ mt: 2 }}>
          {renderRoutes()}
        </Container>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <UploadProvider>
        <MainApp />
      </UploadProvider>
    </AuthProvider>
  );
}

export default App;