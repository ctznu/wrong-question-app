import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Card, CardContent, CardActions, Chip, Select, MenuItem, FormControl, InputLabel, Box, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useMediaQuery, useTheme, IconButton, Menu } from '@mui/material';
import { Link } from 'react-router-dom';
import { Search, Filter, LayoutGrid, LayoutList, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGradeLabel, formatSemester, getSemesterOptions } from '../utils/formatters';

const subjects = [
  { value: 'chinese', label: '语文', color: 'chinese-chip' },
  { value: 'math', label: '数学', color: 'math-chip' },
  { value: 'english', label: '英语', color: 'english-chip' }
];

function Home({ questions, deleteQuestion }) {
  const { user } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || (isSmallScreen ? 'table' : 'card');
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  // 当屏幕尺寸变化时，自动切换视图模式
  useEffect(() => {
    if (isSmallScreen && viewMode === 'card') {
      setViewMode('table');
      localStorage.setItem('viewMode', 'table');
    } else if (!isSmallScreen && !localStorage.getItem('viewMode')) {
      // 只在大屏幕且没有保存的视图模式时设置为卡片模式
      setViewMode('card');
      localStorage.setItem('viewMode', 'card');
    }
  }, [isSmallScreen, viewMode]);

  const handleViewModeChange = (mode) => {
    // 只在大屏幕时允许切换到卡片模式
    if (!isSmallScreen || mode === 'table') {
      setViewMode(mode);
      localStorage.setItem('viewMode', mode);
    }
  };

  const semesters = getSemesterOptions(user?.currentGrade);

  const filteredQuestions = questions.filter(q => {
    return (!selectedSubject || q.subject === selectedSubject) &&
           (!selectedSemester || q.semester === selectedSemester);
  });

  const handleMenuOpen = (event, questionId) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuestionId(questionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuestionId(null);
  };

  const handleViewQuestion = () => {
    handleMenuClose();
    // Navigation will be handled by the Link component in the menu item
  };

  const handleDeleteQuestion = () => {
    if (selectedQuestionId) {
      deleteQuestion(selectedQuestionId);
      handleMenuClose();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel sx={{ minWidth: 120, bgcolor: 'white', px: 0.5 }}><Filter size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} /> 选择学科</InputLabel>
              <Select
                value={selectedSubject}
                label="选择学科"
                onChange={(e) => setSelectedSubject(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">
                  <em>全部学科</em>
                </MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel sx={{ minWidth: 120, bgcolor: 'white', px: 0.5 }}><Search size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} /> 选择学期</InputLabel>
              <Select
                value={selectedSemester}
                label="选择学期"
                onChange={(e) => setSelectedSemester(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">
                  <em>全部学期</em>
                </MenuItem>
                {semesters.map(semester => {
                  const [grade, semesterType] = semester.split('-');
                  return (
                    <MenuItem key={semester} value={semester}>{getGradeLabel(grade)}-{semesterType}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
          {!isSmallScreen && (
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              {viewMode === 'table' ? (
                <Button
                  variant="contained"
                  onClick={() => handleViewModeChange('card')}
                  startIcon={<LayoutGrid size={16} />}
                >
                  卡片
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => handleViewModeChange('table')}
                  startIcon={<LayoutList size={16} />}
                >
                  表格
                </Button>
              )}
            </Box>
          )}
        </Box>
        {!user?.currentGrade && (
          <Alert severity="info" sx={{ mb: 2 }}>
            请先在<a href="/settings" style={{ textDecoration: 'underline' }}>设置页面</a>设置当前年级，以便系统自动计算学期
          </Alert>
        )}

        {viewMode === 'card' ? (
            <div className="questions-grid">
            {filteredQuestions.map(question => {
              const subjectInfo = subjects.find(s => s.value === question.subject) || subjects[0];
              return (
                <Card className="question-card" key={question._id || question.id}>
                  <CardContent className="question-card-content">
                      <Chip
                        label={subjectInfo.label}
                        size="small"
                        className={`subject-chip ${subjectInfo.color}`}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body1" className="question-preview">
                        {question.question}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {formatSemester(question.semester)}
                      </Typography>
                      <Box className="question-tags" sx={{ mt: 2 }}>
                        {question.tags && question.tags.length > 0 && question.tags.slice(0, 3).map((tag, index) => (
                          tag && (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              className="tag-chip"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions className="question-card-actions">
                      <Button
                        size="small"
                        component={Link}
                        to={`/question/${question._id || question.id}`}
                        variant="contained"
                        sx={{ flex: 1, mr: 1, whiteSpace: 'nowrap' }}
                      >
                        查看详情
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => deleteQuestion(question._id || question.id)}
                        variant="outlined"
                        sx={{ flex: 1, whiteSpace: 'nowrap' }}
                      >
                        删除
                      </Button>
                    </CardActions>
                  </Card>
                );
            })}
          </div>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              {!isSmallScreen && (
                <TableHead>
                  <TableRow>
                    <TableCell>学科</TableCell>
                    <TableCell>题目</TableCell>
                    <TableCell>学期</TableCell>
                    <TableCell>标签</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {filteredQuestions.map(question => {
                  const subjectInfo = subjects.find(s => s.value === question.subject) || subjects[0];
                  return (
                    <TableRow key={question._id || question.id}>
                      <TableCell sx={{ padding: isSmallScreen ? 1.5 : 'inherit' }}>
                        <Chip
                          label={isSmallScreen ? subjectInfo.label.charAt(0) : subjectInfo.label}
                          size="small"
                          className={`subject-chip ${subjectInfo.color}`}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        width: isSmallScreen ? '100%' : 'auto',
                        minWidth: 120,
                        maxWidth: isSmallScreen ? 'calc(100vw - 180px)' : '500px',
                        padding: isSmallScreen ? 1.5 : 'inherit'
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                        >
                          {question.question}
                        </Typography>
                      </TableCell>
                      {!isSmallScreen && <TableCell>{formatSemester(question.semester)}</TableCell>}
                      {!isSmallScreen && (
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {question.tags && question.tags.filter(tag => tag && tag.trim()).slice(0, 2).map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell sx={{ padding: isSmallScreen ? 1.5 : 'inherit' }}>
                        {isSmallScreen ? (
                          <>
                            <IconButton
                              size="small"
                              onClick={(event) => handleMenuOpen(event, question._id || question.id)}
                            >
                              <MoreVertical size={16} />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Button
                              size="small"
                              component={Link}
                              to={`/question/${question._id || question.id}`}
                              variant="contained"
                              sx={{ mr: 1 }}
                            >
                              查看
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => deleteQuestion(question._id || question.id)}
                              variant="outlined"
                            >
                              删除
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredQuestions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              📚 暂无错题记录
            </Typography>
            <Typography variant="body1" color="text.secondary">
              点击上方"上传错题"按钮开始添加您的第一道错题
            </Typography>
          </Box>
        )}

        {/* 三点菜单 */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiMenu-paper': {
              borderRadius: 1,
              minWidth: 120,
            },
          }}
        >
          <MenuItem 
            component={Link} 
            to={`/question/${selectedQuestionId}`}
            onClick={handleViewQuestion}
          >
            查看
          </MenuItem>
          <MenuItem onClick={handleDeleteQuestion} sx={{ color: 'error.main' }}>
            删除
          </MenuItem>
        </Menu>
      </Container>
  );
}

export default Home;
