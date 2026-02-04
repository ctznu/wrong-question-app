import React, { useState } from 'react';
import { Container, Typography, Button, Card, CardContent, CardActions, Chip, Select, MenuItem, FormControl, InputLabel, Box, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, LayoutGrid, LayoutList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const subjects = [
  { value: 'chinese', label: '语文', color: 'chinese-chip' },
  { value: 'math', label: '数学', color: 'math-chip' },
  { value: 'english', label: '英语', color: 'english-chip' }
];

const getGradeLabel = (grade) => {
  const gradeMap = {
    '1': '一年级',
    '2': '二年级',
    '3': '三年级',
    '4': '四年级',
    '5': '五年级',
    '6': '六年级'
  };
  return gradeMap[grade] || grade;
};

const formatSemester = (semester) => {
  if (!semester) return semester;
  const [grade, semesterType] = semester.split('-');
  return `${getGradeLabel(grade)}-${semesterType}`;
};

function Home({ questions, deleteQuestion }) {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'card';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const getSemesterOptions = () => {
    const currentGrade = user?.currentGrade;
    if (!currentGrade) return [];
    
    const now = new Date();
    const month = now.getMonth() + 1;
    
    const options = [];
    
    for (let i = 0; i < 2; i++) {
      const grade = parseInt(currentGrade) - i;
      if (grade >= 1) {
        options.push(`${grade}-上`);
        options.push(`${grade}-下`);
      }
    }
    
    return options;
  };

  const semesters = getSemesterOptions();

  const filteredQuestions = questions.filter(q => {
    return (!selectedSubject || q.subject === selectedSubject) &&
           (!selectedSemester || q.semester === selectedSemester);
  });

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
              <TableHead>
                <TableRow>
                  <TableCell>学科</TableCell>
                  <TableCell>题目</TableCell>
                  <TableCell>学期</TableCell>
                  <TableCell>标签</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.map(question => {
                  const subjectInfo = subjects.find(s => s.value === question.subject) || subjects[0];
                  return (
                    <TableRow key={question._id || question.id}>
                      <TableCell>
                        <Chip
                          label={subjectInfo.label}
                          size="small"
                          className={`subject-chip ${subjectInfo.color}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {question.question}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatSemester(question.semester)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {question.tags && question.tags.length > 0 && question.tags.slice(0, 2).map((tag, index) => (
                            tag && (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                              />
                            )
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
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
      </Container>
  );
}

export default Home;
