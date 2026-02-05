import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, TextField, Card, CardContent, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, FormControl, InputLabel, Checkbox, FormControlLabel, Stack } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Save, X, RotateCcw, ArrowLeft, Lightbulb, Loader2, CheckCircle } from 'lucide-react';

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

const errorTypes = [
  '计算错误',
  '概念不清',
  '审题错误',
  '粗心大意',
  '其他'
];

function QuestionDetail({ questions, updateQuestion, generateSimilar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState({});
  const [similarQuestionDialog, setSimilarQuestionDialog] = useState(false);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [loadingGenerated, setLoadingGenerated] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, question: null, index: null });

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

  useEffect(() => {
    const loadGeneratedQuestions = async () => {
      if (question?._id || question?.id) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions/original/${question._id || question.id}`);
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
    };
    loadGeneratedQuestions();
  }, [question]);

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
      alert('请先完善错题信息（题目、正确答案、错误类型）');
      return;
    }

    setGeneratingSimilar(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/generate_similar_question', {
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
          questionType: 'short_answer'
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '生成类似题目失败');
      }

      setSimilarQuestion(data.similar_question);
      setSimilarQuestionDialog(true);
    } catch (error) {
      console.error('生成类似题目失败:', error);
      alert('生成类似题目失败: ' + error.message);
    } finally {
      setGeneratingSimilar(false);
    }
  };

  if (!question) return <Typography>加载中...</Typography>;

  return (
    <Container maxWidth="md" className="app-main-container">
      <Container maxWidth="md" sx={{ mt: 2 }}>
        <Paper className="detail-card">
          <CardContent className="detail-card-content">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h1" gutterBottom>
                错题详情
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                startIcon={<ArrowLeft size={16} />}
              >
                返回首页
              </Button>
            </Box>

            <Button
              variant="outlined"
              onClick={() => setIsEditing(!isEditing)}
              startIcon={isEditing ? <X size={16} /> : <Edit3 size={16} />}
              className="edit-button"
            >
              {isEditing ? '取消编辑' : '编辑'}
            </Button>

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
                    rows={4}
                    value={editedQuestion.question || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
                    placeholder="请输入题目内容..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Box>
                {/* 正确答案和错误答案放在一行，各占50% */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="正确答案"
                    value={editedQuestion.correctAnswer || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, correctAnswer: e.target.value })}
                    placeholder="请输入正确答案..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="错误答案"
                    value={editedQuestion.wrongAnswer || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, wrongAnswer: e.target.value })}
                    placeholder="请输入错误答案..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                    sx={{ flex: 1 }}
                  />
                </Box>
                {/* 错误原因单独占一行 */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="错误原因"
                    multiline
                    rows={4}
                    value={editedQuestion.reason || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, reason: e.target.value })}
                    placeholder="请输入错误原因分析..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Box>
                {/* 错误类型单独占一行，支持多选 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    错误类型
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
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
                  >
                    保存更改
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <strong>题目：</strong>
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
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

                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>正确答案：</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {question.correctAnswer}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color="error" gutterBottom>
                      <strong>错误答案：</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {question.wrongAnswer}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  <strong>错误原因：</strong>
                </Typography>
                <Typography variant="body1" paragraph>
                  {question.reason || '暂无错误原因分析'}
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
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

                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>学期：</strong> {formatSemester(question.semester)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>创建时间：</strong> {question.createdAt}
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

          <Button
            variant="contained"
            color="secondary"
            onClick={handleGenerate}
            disabled={generatingSimilar}
            startIcon={generatingSimilar ? <Loader2 size={16} className="spin" /> : <Lightbulb size={16} />}
            sx={{ mt: 2 }}
          >
            {generatingSimilar ? '生成中...' : '生成类似题目'}
          </Button>
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
        onClose={() => setSimilarQuestionDialog(false)}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimilarQuestionDialog(false)}>
            关闭
          </Button>
          {similarQuestion && (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
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
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/generated-questions/${deleteDialog.question._id}`, {
                  method: 'DELETE',
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
