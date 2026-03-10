import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Button, Box, TextField, Card, CardContent, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Stack } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Save, X, ArrowLeft, Lightbulb, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGradeLabel, formatSemester, getSemesterOptions, formatDate } from '../utils/formatters';
import FlexibleTextarea from './FlexibleTextarea';



function QuestionDetail({ questions, updateQuestion, generateSimilar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState({});
  const [similarQuestionDialog, setSimilarQuestionDialog] = useState(false);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState(null);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, question: null, index: null });
  const [generateCount, setGenerateCount] = useState(1);

  const semesters = getSemesterOptions(user?.currentGrade);

  const handleTagChange = (tag, checked) => {
    const currentTags = editedQuestion.tags || [];
    if (checked) {
      setEditedQuestion({ ...editedQuestion, tags: [...currentTags, tag] });
    } else {
      setEditedQuestion({ ...editedQuestion, tags: currentTags.filter(t => t !== tag) });
    }
  };

  useEffect(() => {
    const q = questions.find(q => q._id === id || q.id === parseInt(id));
    if (q) {
      setQuestion(q);
      setEditedQuestion(q);
    }
  }, [id, questions]);

  const loadGeneratedQuestions = useCallback(async () => {
    if (question?._id || question?.id) {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['x-auth-token'] = token;
        }
        
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions/original/${question._id || question.id}`, {
          headers
        });
        if (response.ok) {
          const data = await response.json();
          setGeneratedQuestions(data);
        } else {
          console.error('加载生成的类似题目失败');
        }
      } catch (error) {
        console.error('加载生成的类似题目失败:', error);
      }
    }
  }, [question?._id, question?.id]);

  useEffect(() => {
    loadGeneratedQuestions();
  }, [loadGeneratedQuestions]);

  const handleSave = async () => {
    try {
      const updated = await updateQuestion(question._id || parseInt(id), editedQuestion);
      setQuestion(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const handleGenerate = async () => {
    if (!question.question || !question.correctAnswer || !question.tags) {
      setSnackbar({ open: true, message: '请先完善错题信息（题目、正确答案、错误类型）', severity: 'warning' });
      return;
    }

    setGeneratingSimilar(true);

    try {
      const ocrServerUrl = process.env.REACT_APP_OCR_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${ocrServerUrl}/generate_similar_questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.question,
          correctAnswer: question.correctAnswer,
          studentAnswer: question.wrongAnswer,
          errorType: question.tags,
          errorReason: question.reason,
          subject: question.subject,
          questionType: 'short_answer',
          count: generateCount,
          grade: user?.currentGrade || ''
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '生成类似题目失败');
      }

      if (data.similar_questions && data.similar_questions.length > 0) {
        if (data.similar_questions.length === 1) {
          setSimilarQuestion(data.similar_questions[0]);
          setSimilarQuestionDialog(true);
        } else {
          setSimilarQuestionDialog(true);
          setSimilarQuestion(null);
          setSimilarQuestions(data.similar_questions);
        }
      }
    } catch (error) {
      console.error('生成类似题目失败:', error);
      setSnackbar({ open: true, message: '生成类似题目失败: ' + error.message, severity: 'error' });
    } finally {
      setGeneratingSimilar(false);
    }
  };

  if (!question) return <Typography>加载中...</Typography>;

  return (
    <Container maxWidth="md" className="app-main-container" sx={{ px: { xs: 0, sm: 2 } }}>
      <Container maxWidth="md" sx={{ mt: 2, px: { xs: 0, sm: 2 } }}>
        <Paper className="detail-card" sx={{ mx: { xs: 0, sm: 'auto' }, bgcolor: '#ffffff' }}>
          <CardContent className="detail-card-content" sx={{ px: { xs: 1, sm: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                startIcon={<ArrowLeft size={16} />}
                size="small"
              >
                返回首页
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(!isEditing)}
                startIcon={isEditing ? <X size={16} /> : <Edit3 size={16} />}
                size="small"
              >
                {isEditing ? '取消编辑' : '编辑'}
              </Button>
            </Box>

            {question.imageUrl && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <img
                  src={question.imageUrl}
                  alt="Question"
                  className="preview-image"
                />
              </Box>
            )}

            {isEditing ? (
              <Box>
                {/* 题目内容单独占一行 */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="题目内容"
                    multiline
                    rows={{ xs: 3, md: 4 }}
                    value={editedQuestion.question || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                    placeholder="请输入题目内容..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Box>
                {/* 正确答案和解析 - 响应式布局 */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                  <TextField
                    label="正确答案"
                    multiline
                    rows={{ xs: 3, sm: 3 }}
                    value={editedQuestion.correctAnswer || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, correctAnswer: e.target.value })}
                    placeholder="请输入正确答案..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                    sx={{ flex: 1 }}
                  />
                  <FlexibleTextarea
                    label="解析"
                    value={editedQuestion.explanation || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, explanation: e.target.value })}
                    placeholder="请输入题目解析（包含推理步骤）..."
                    flex={3}
                  />
                </Box>
                {/* 错误答案和错误原因 - 响应式布局 */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                  <TextField
                    label="错误答案"
                    multiline
                    rows={2}
                    value={editedQuestion.wrongAnswer || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, wrongAnswer: e.target.value })}
                    placeholder="请输入错误答案..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                    sx={{ flex: 1 }}
                  />
                  <FlexibleTextarea
                    label="错误原因"
                    value={editedQuestion.reason || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, reason: e.target.value })}
                    placeholder="请输入错误原因分析..."
                    flex={3}
                  />
                </Box>
                {/* 学期选择器 */}
                <Box sx={{ mb: 2 }}>
                  <FormControl sx={{ width: 200 }}>
                    <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>学期</InputLabel>
                    <Select
                      value={editedQuestion.semester || ''}
                      label="学期"
                      onChange={(e) => setEditedQuestion({ ...editedQuestion, semester: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>未选择</em>
                      </MenuItem>
                      {semesters.map(semester => {
                        const [grade, semesterType] = semester.split('-');
                        return (
                          <MenuItem key={semester} value={semester}>
                            {getGradeLabel(grade)}-{semesterType}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
                {/* 错误类型单独占一行，支持多选，在移动设备上改为垂直排列 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    错误类型
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={<Checkbox checked={editedQuestion.tags?.includes('计算错误')} onChange={(e) => handleTagChange('计算错误', e.target.checked)} />}
                      label="计算错误"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={editedQuestion.tags?.includes('概念不清')} onChange={(e) => handleTagChange('概念不清', e.target.checked)} />}
                      label="概念不清"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={editedQuestion.tags?.includes('审题错误')} onChange={(e) => handleTagChange('审题错误', e.target.checked)} />}
                      label="审题错误"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={editedQuestion.tags?.includes('粗心大意')} onChange={(e) => handleTagChange('粗心大意', e.target.checked)} />}
                      label="粗心大意"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={editedQuestion.tags?.includes('其他')} onChange={(e) => handleTagChange('其他', e.target.checked)} />}
                      label="其他"
                    />
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    startIcon={<Save size={16} />}
                    size="medium"
                  >
                    保存更改
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  <strong>题目：</strong>
                </Typography>
                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {question.question}
                </Typography>

                {question.options && question.options.length > 0 && (
                  <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {question.options.map((opt, idx) => (
                      <Typography key={idx} variant="body2" sx={{ 
                        mb: 1,
                        flex: '0 0 auto',
                        textAlign: 'left',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {opt.key}. {opt.text}
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* 正确答案和解析 - 响应式布局 */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1, bgcolor: '#ffffff' }}>
                  <Box sx={{ flex: 1, bgcolor: '#ffffff' }}>
                    <Typography variant="body2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                      <strong>正确答案：</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {question.correctAnswer}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 3, bgcolor: '#ffffff' }}>
                    <Typography variant="body2" color="text.primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                      <strong>解析：</strong>
                    </Typography>
                    <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                      {question.explanation || '暂无解析'}
                    </Typography>
                  </Box>
                </Box>

                {/* 错误答案和错误原因 - 响应式布局 */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1, bgcolor: '#ffffff' }}>
                  <Box sx={{ flex: 1, bgcolor: '#ffffff' }}>
                    <Typography variant="body2" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                      <strong>错误答案：</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {question.wrongAnswer}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 3, bgcolor: '#ffffff' }}>
                    <Typography variant="body2" color="text.primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                      <strong>错误原因：</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {question.reason || '暂无错误原因分析'}
                    </Typography>
                  </Box>
                </Box>



                <Typography variant="body2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                  <strong>标签：</strong>
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {question.tags && question.tags.length > 0 && question.tags.map((tag, index) => (
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

                {/* 学期和创建时间在移动设备上改为垂直排列 */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>学期：</strong> {formatSemester(question.semester)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                    <strong>创建时间：</strong> {formatDate(question.createdAt)}
                  </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Paper>

        <Paper className="similar-questions-section">
          <Typography variant="h6" gutterBottom>
            <Lightbulb size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            类似练习题
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>生成数量</InputLabel>
              <Select
                value={generateCount}
                label="生成数量"
                onChange={(e) => setGenerateCount(e.target.value)}
                disabled={generatingSimilar}
              >
                <MenuItem value={1}>1道</MenuItem>
                <MenuItem value={2}>2道</MenuItem>
                <MenuItem value={3}>3道</MenuItem>
                <MenuItem value={5}>5道</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleGenerate}
              disabled={generatingSimilar}
              startIcon={generatingSimilar ? <Loader2 size={16} className="spin" /> : <Lightbulb size={16} />}
            >
              {generatingSimilar ? '生成中...' : '生成类似题目'}
            </Button>
          </Box>
        </Paper>

        {generatedQuestions.length > 0 && (
          <Paper className="generated-questions-section" sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#4caf50' }} />
              已生成的类似题目
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {generatedQuestions.map((q, idx) => (
                <Card key={idx}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', flex: 1 }}>
                          {q.questionText}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, question: q, index: idx })}
                          startIcon={<X size={16} />}
                          sx={{ ml: 1, minWidth: '80px' }}
                        >
                          删除
                        </Button>
                      </Box>
                      {q.options && q.options.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          {q.options.map((opt, optIdx) => (
                            <Typography key={optIdx} variant="body2" sx={{ fontSize: '0.9rem' }}>
                              {opt.key}. {opt.text}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ color: '#4caf50', mb: 1 }}>
                        <strong>正确答案：</strong>{q.correctAnswer}
                      </Typography>
                      {q.explanation && (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                          <strong>解题思路：</strong>{q.explanation}
                        </Typography>
                      )}
                      {q.targetError && (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#f44336' }}>
                          <strong>针对错误：</strong>{q.targetError}
                        </Typography>
                      )}
                      {q.practicePoint && (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                          <strong>练习知识点：</strong>{q.practicePoint}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
              ))}
            </Box>
          </Paper>
        )}
      </Container>

      <Dialog
        open={similarQuestionDialog}
        onClose={() => {
          setSimilarQuestionDialog(false);
          setSimilarQuestion(null);
          setSimilarQuestions([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Lightbulb size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          类似练习题
        </DialogTitle>
        <DialogContent>
          {similarQuestion && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {similarQuestion.question_text}
              </Typography>
              {similarQuestion.options && similarQuestion.options.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {similarQuestion.options.map((opt, idx) => (
                    <Typography key={idx} variant="body2" sx={{ 
                      mb: 1,
                      flex: '0 0 auto',
                      textAlign: 'left',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {opt.key}. {opt.text}
                    </Typography>
                  ))}
                </Box>
              )}
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>正确答案：</strong>{similarQuestion.correct_answer}
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>解题思路：</strong>{similarQuestion.explanation}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>针对错误：</strong>{similarQuestion.target_error}
              </Typography>
              <Typography variant="body2">
                <strong>练习知识点：</strong>{similarQuestion.practice_point}
              </Typography>
            </Box>
          )}
          {similarQuestions && similarQuestions.length > 0 && (
            <Box>
              {similarQuestions.map((q, idx) => (
                <Box key={idx} sx={{ mb: 3, pb: 3, borderBottom: idx < similarQuestions.length - 1 ? '1px solid #e0e0e0' : 'transparent' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    题目 {idx + 1}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {q.question_text}
                  </Typography>
                  {q.options && q.options.length > 0 && (
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {q.options.map((opt, optIdx) => (
                        <Typography key={optIdx} variant="body2" sx={{ 
                          mb: 1,
                          flex: '0 0 auto',
                          textAlign: 'left',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {opt.key}. {opt.text}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>正确答案：</strong>{q.correct_answer}
                  </Alert>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>解题思路：</strong>{q.explanation}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>针对错误：</strong>{q.target_error}
                  </Typography>
                  <Typography variant="body2">
                    <strong>练习知识点：</strong>{q.practice_point}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': token
                          },
                          body: JSON.stringify({
                            originalQuestionId: question._id || parseInt(id),
                            questionText: q.question_text,
                            options: q.options || [],
                            correctAnswer: q.correct_answer,
                            explanation: q.explanation,
                            targetError: q.target_error,
                            practicePoint: q.practice_point
                          }),
                        });

                        if (response.ok) {
                          setSnackbar({ open: true, message: `题目 ${idx + 1} 保存成功！`, severity: 'success' });
                          await loadGeneratedQuestions();
                        } else {
                          const data = await response.json();
                          setSnackbar({ open: true, message: data.message || '保存失败', severity: 'error' });
                        }
                      } catch (error) {
                        console.error('保存失败:', error);
                        setSnackbar({ open: true, message: '保存失败: ' + error.message, severity: 'error' });
                      }
                    }}
                    startIcon={<Save size={16} />}
                    sx={{ mt: 1 }}
                  >
                    保存题目 {idx + 1}
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSimilarQuestionDialog(false);
            setSimilarQuestion(null);
            setSimilarQuestions([]);
          }}>
            关闭
          </Button>
          {similarQuestion && similarQuestions.length === 0 && (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-auth-token': token
                    },
                    body: JSON.stringify({
                      originalQuestionId: question._id || parseInt(id),
                      questionText: similarQuestion.question_text,
                      options: similarQuestion.options || [],
                      correctAnswer: similarQuestion.correct_answer,
                      explanation: similarQuestion.explanation,
                      targetError: similarQuestion.target_error,
                      practicePoint: similarQuestion.practice_point
                    }),
                  });

                  if (response.ok) {
                    setSnackbar({ open: true, message: '类似题目保存成功！', severity: 'success' });
                    setSimilarQuestionDialog(false);
                    setSimilarQuestion(null);
                    setSimilarQuestions([]);
                    await loadGeneratedQuestions();
                  } else {
                    const data = await response.json();
                    setSnackbar({ open: true, message: data.message || '保存失败', severity: 'error' });
                  }
                } catch (error) {
                  console.error('保存失败:', error);
                  setSnackbar({ open: true, message: '保存失败: ' + error.message, severity: 'error' });
                }
              }}
              startIcon={<Save size={16} />}
            >
              保存
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
        maxWidth="xs"
      >
        <DialogTitle>删除确认</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            确定要删除这个类似题目吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions/${deleteDialog.question._id}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                  }
                });
                if (response.ok) {
                  setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== deleteDialog.index));
                  setSnackbar({ open: true, message: '删除成功！', severity: 'success' });
                  setDeleteDialog({ ...deleteDialog, open: false });
                } else {
                  const data = await response.json();
                  setSnackbar({ open: true, message: data.message || '删除失败', severity: 'error' });
                }
              } catch (error) {
                console.error('删除失败:', error);
                setSnackbar({ open: true, message: '删除失败: ' + error.message, severity: 'error' });
              }
            }}
          >
            删除
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
            <CheckCircle size={20} />
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

export default QuestionDetail;
