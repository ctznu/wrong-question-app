import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, TextField, Grid, Card, CardContent, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar } from '@mui/material';
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

function QuestionDetail({ questions, updateQuestion, generateSimilar }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState({});
  const [similarQuestionDialog, setSimilarQuestionDialog] = useState(false);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // 查找问题，兼容MongoDB的_id和旧的id字段
    const q = questions.find(q => q._id === id || q.id === parseInt(id));
    if (q) {
      setQuestion(q);
      setEditedQuestion(q);
    }
  }, [id, questions]);

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
              <Grid container spacing={3}>
                <Grid item xs={12}>
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="正确答案"
                    value={editedQuestion.correctAnswer || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, correctAnswer: e.target.value })}
                    placeholder="请输入正确答案..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="错误答案"
                    value={editedQuestion.wrongAnswer || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, wrongAnswer: e.target.value })}
                    placeholder="请输入错误答案..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="错误原因"
                    multiline
                    rows={3}
                    value={editedQuestion.reason || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, reason: e.target.value })}
                    placeholder="请输入错误原因分析..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="标签（用逗号分隔）"
                    value={editedQuestion.tags?.join(', ') || ''}
                    onChange={(e) => setEditedQuestion({ ...editedQuestion, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                    placeholder="请输入标签，用逗号分隔..."
                    InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    startIcon={<Save size={16} />}
                    sx={{ mr: 2 }}
                  >
                    保存更改
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                    startIcon={<X size={16} />}
                  >
                    取消
                  </Button>
                </Grid>
              </Grid>
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

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>正确答案：</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {question.correctAnswer}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" color="error" gutterBottom>
                      <strong>错误答案：</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {question.wrongAnswer}
                    </Typography>
                  </Grid>
                </Grid>

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

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>学期：</strong> {formatSemester(question.semester)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>创建时间：</strong> {question.createdAt}
                    </Typography>
                  </Grid>
                </Grid>
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