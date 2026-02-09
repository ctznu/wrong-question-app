import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, FormControl, InputLabel, Select, MenuItem, Button, Alert, TextField, Divider } from '@mui/material';
import { Settings as SettingsIcon, Save, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const grades = [
  { value: '1', label: '一年级' },
  { value: '2', label: '二年级' },
  { value: '3', label: '三年级' },
  { value: '4', label: '四年级' },
  { value: '5', label: '五年级' },
  { value: '6', label: '六年级' }
];

function Settings() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [studentName, setStudentName] = useState(user?.studentName || '');
  const [currentGrade, setCurrentGrade] = useState(user?.currentGrade || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 密码修改状态
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setStudentName(user.studentName || '');
      setCurrentGrade(user.currentGrade || '');
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // 使用环境变量或默认值作为 API 基础 URL
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://106.14.163.150:5001/api';
      
      const response = await fetch(`${apiBaseUrl}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ username, studentName, currentGrade })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || '保存失败');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('保存设置失败:', err);
      setError(`保存设置失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setPasswordError('');
    
    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      setPasswordError('新密码和确认密码不一致');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // 使用环境变量或默认值作为 API 基础 URL
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://106.14.163.150:5001/api';
      
      const response = await fetch(`${apiBaseUrl}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || '修改密码失败');
      }

      // 密码修改成功，清空表单
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      console.error('修改密码失败:', err);
      setPasswordError(`修改密码失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (value) => {
    const found = grades.find(g => g.value === value);
    return found ? found.label : value || '未设置';
  };

  return (
    <Container maxWidth="md" className="app-main-container">
      <Container maxWidth="md" sx={{ mt: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon size={24} style={{ marginRight: '12px' }} />
            设置
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              用户信息
            </Typography>
            
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mt: 2 }}
            />
            
            <TextField
              fullWidth
              label="学生姓名"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              sx={{ mt: 2 }}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>当前年级 *</InputLabel>
              <Select
                value={currentGrade}
                label="当前年级 *"
                onChange={(e) => setCurrentGrade(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                {grades.map(g => (
                  <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              设置当前年级后，系统会自动计算学期（如：三年级-上、三年级-下）
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!currentGrade || loading}
                startIcon={<Save size={16} />}
              >
                {loading ? '保存中...' : '保存设置'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {saved && (
              <Alert severity="success" sx={{ mt: 2 }}>
                设置已保存！用户名：{username || '未设置'}，学生姓名：{studentName || '未设置'}，当前年级：{getGradeLabel(currentGrade)}
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Lock size={20} style={{ marginRight: '8px' }} />
              修改密码
            </Typography>

            <TextField
              fullWidth
              label="旧密码"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="新密码"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="新密码长度至少为6个字符"
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="确认新密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              helperText={confirmPassword && newPassword !== confirmPassword ? "新密码和确认密码不一致" : ""}
              error={confirmPassword && newPassword !== confirmPassword}
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={!oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || loading}
                startIcon={<Save size={16} />}
              >
                {loading ? '修改中...' : '修改密码'}
              </Button>
            </Box>

            {passwordError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {passwordError}
              </Alert>
            )}

            {passwordSaved && (
              <Alert severity="success" sx={{ mt: 2 }}>
                密码修改成功！
              </Alert>
            )}
          </Box>
        </Paper>
      </Container>
    </Container>
  );
}

export default Settings;
