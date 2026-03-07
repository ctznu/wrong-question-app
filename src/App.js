import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Container, CircularProgress, Alert, Box } from '@mui/material';
import { LogOut as LogOutIcon, BookOpen as BookOpenIcon, Home as HomeIcon, Upload as UploadIcon, Lightbulb as LightbulbIcon, Printer as PrinterIcon, BarChart as BarChartIcon, Settings as SettingsIcon, Users as UsersIcon } from 'lucide-react';
import Home from './components/Home';
import Upload from './components/Upload';
import QuestionDetail from './components/QuestionDetail';
import Generator from './components/Generator';
import Printer from './components/Printer';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import Admin from './components/Admin';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UploadProvider } from './contexts/UploadContext';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0891B2',
      light: '#22D3EE',
      dark: '#164E63',
    },
    secondary: {
      main: '#059669',
      light: '#34D399',
      dark: '#064E3B',
    },
    background: {
      default: '#ECFEFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#164E63',
      secondary: '#0E7490',
    },
  },
  typography: {
    fontFamily: '"Baloo 2", "Comic Neue", cursive, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '10px 24px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25)',
          transition: 'all 0.2s ease-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(8, 145, 178, 0.35)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '3px solid rgba(255, 255, 255, 0.8)',
          boxShadow: 
            '8px 8px 16px rgba(8, 145, 178, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.9), inset 2px 2px 4px rgba(255, 255, 255, 0.5), inset -2px -2px 4px rgba(8, 145, 178, 0.1)',
          transition: 'all 0.2s ease-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 
              '12px 12px 24px rgba(8, 145, 178, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.95), inset 3px 3px 6px rgba(255, 255, 255, 0.6), inset -3px -3px 6px rgba(8, 145, 178, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '2px solid rgba(255, 255, 255, 0.6)',
          boxShadow: 
            '6px 6px 12px rgba(8, 145, 178, 0.12), -6px -6px 12px rgba(255, 255, 255, 0.85)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            boxShadow: 'inset 2px 2px 4px rgba(8, 145, 178, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: 'inset 3px 3px 6px rgba(8, 145, 178, 0.15), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
            },
            '&.Mui-focused': {
              boxShadow: 'inset 4px 4px 8px rgba(8, 145, 178, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.95)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: '0 0 20px 20px',
          border: '3px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 4px 16px rgba(8, 145, 178, 0.15)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(240, 253, 250, 0.9)',
          boxShadow: 'inset 2px 2px 4px rgba(8, 145, 178, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 'inset 3px 3px 6px rgba(8, 145, 178, 0.15), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
          },
          '&.Mui-focused': {
            boxShadow: 'inset 4px 4px 8px rgba(8, 145, 178, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.95)',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '2px solid rgba(255, 255, 255, 0.8)',
          background: 'linear-gradient(145deg, #ffffff, #f0fdfa)',
          boxShadow: '8px 8px 16px rgba(8, 145, 178, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.9)',
          marginTop: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          padding: '10px 16px',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(8, 145, 178, 0.1)',
            boxShadow: '2px 2px 4px rgba(8, 145, 178, 0.1), -2px -2px 4px rgba(255, 255, 255, 0.6)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(8, 145, 178, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(8, 145, 178, 0.2)',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(240, 253, 250, 0.9)',
          boxShadow: 'inset 2px 2px 4px rgba(8, 145, 178, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
          '&:hover': {
            boxShadow: 'inset 3px 3px 6px rgba(8, 145, 178, 0.15), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
          },
          '&.Mui-focused': {
            boxShadow: 'inset 4px 4px 8px rgba(8, 145, 178, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.95)',
          },
        },
      },
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

  // 添加问题到本地列表（API调用已在Upload页面完成）
  const addQuestion = (newQuestion) => {
    setQuestions([newQuestion, ...questions]);
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
      <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', py: { xs: 1, sm: 2 } }}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1, flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit', 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              <BookOpenIcon style={{ verticalAlign: 'middle', marginRight: { xs: '8px', sm: '12px' }, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              <span>小学生易错题管理系统</span>
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9, 
                mt: 0.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              智能识别、归纳、生成类似题目，助力孩子学习成长
            </Typography>
          </Box>
          {user ? (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: 1, 
                  textAlign: 'left',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                欢迎, {user.username} ({user.role})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, flexWrap: 'wrap' }}>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/" 
                  size="small" 
                  startIcon={<HomeIcon size={16} />}
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }} 
                >
                  首页
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/upload" 
                  size="small" 
                  startIcon={<UploadIcon size={16} />}
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }} 
                >
                  上传
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/generator" 
                  size="small" 
                  startIcon={<LightbulbIcon size={16} />}
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }} 
                >
                  生成题目
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/printer" 
                  size="small" 
                  startIcon={<PrinterIcon size={16} />}
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }} 
                >
                  打印
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/statistics" 
                  size="small" 
                  startIcon={<BarChartIcon size={16} />}
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }} 
                >
                  统计分析
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/settings" 
                  size="small" 
                  startIcon={<SettingsIcon size={16} />}
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }} 
                >
                  设置
                </Button>
                {user?.role === 'admin' && (
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin" 
                    size="small" 
                    startIcon={<UsersIcon size={16} />}
                    sx={{ 
                      whiteSpace: 'nowrap', 
                      minWidth: { xs: '48px', sm: 'auto' },
                      padding: { xs: '8px', sm: '8px 16px' },
                      '& .MuiButton-startIcon': {
                        display: 'flex',
                        margin: { xs: 0, sm: '0 8px 0 0' }
                      },
                      '& .MuiButton-label': {
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        justifyContent: 'center'
                      },
                      '& .MuiButton-text': {
                        display: { xs: 'none', sm: 'inline' }
                      }
                    }} 
                  >
                    管理员
                  </Button>
                )}
                <Button
                  color="inherit"
                  onClick={logout}
                  startIcon={<LogOutIcon size={16} />}
                  size="small"
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    minWidth: { xs: '48px', sm: 'auto' },
                    padding: { xs: '8px', sm: '8px 16px' },
                    '& .MuiButton-startIcon': {
                      display: 'flex',
                      margin: { xs: 0, sm: '0 8px 0 0' }
                    },
                    '& .MuiButton-label': {
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    '& .MuiButton-text': {
                      display: { xs: 'none', sm: 'inline' }
                    }
                  }}
                >
                  登出
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login" 
                size="small" 
                sx={{ 
                  whiteSpace: 'nowrap', 
                  minWidth: { xs: '48px', sm: 'auto' },
                  padding: { xs: '8px', sm: '8px 16px' },
                  '& .MuiButton-text': {
                    display: { xs: 'none', sm: 'inline' }
                  }
                }} 
              >
                登录
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/register" 
                size="small" 
                sx={{ 
                  whiteSpace: 'nowrap', 
                  minWidth: { xs: '48px', sm: 'auto' },
                  padding: { xs: '8px', sm: '8px 16px' },
                  '& .MuiButton-text': {
                    display: { xs: 'none', sm: 'inline' }
                  }
                }} 
              >
                注册
              </Button>
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
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
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