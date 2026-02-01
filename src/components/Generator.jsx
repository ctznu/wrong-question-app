import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Card, CardContent, CircularProgress, Alert, Paper, Checkbox, IconButton } from '@mui/material';
import { PlusCircle, RotateCcw, Printer, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';

const subjects = [
  { value: 'chinese', label: '语文', color: 'chinese-chip' },
  { value: 'math', label: '数学', color: 'math-chip' },
  { value: 'english', label: '英语', color: 'english-chip' }
];

const difficulties = [
  { value: 'easy', label: '容易' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
];

function Generator() {
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());

  useEffect(() => {
    fetchGeneratedQuestions();
  }, []);

  const fetchGeneratedQuestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/generated-questions`);
      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestions(data);
      }
    } catch (err) {
      console.error('获取生成的题目失败:', err);
    }
  };

  const generateSingleQuestion = async () => {
    if (!subject || !topic) {
      setError('请选择学科和输入主题');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedQuestion(null);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          topic,
          difficulty
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedQuestion(data);
    } catch (err) {
      console.error('生成题目失败:', err);
      setError('生成题目失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToGeneratedList = () => {
    if (generatedQuestion) {
      setGeneratedQuestions([...generatedQuestions, generatedQuestion]);
      setGeneratedQuestion(null);
      setTopic('');
    }
  };

  const toggleQuestionSelection = (questionId) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const deleteQuestion = async (questionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generated-questions/${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGeneratedQuestions(generatedQuestions.filter(q => q._id !== questionId));
      }
    } catch (err) {
      console.error('删除题目失败:', err);
    }
  };

  const printSelectedQuestions = () => {
    const selected = generatedQuestions.filter(q => selectedQuestions.has(q._id));
    if (selected.length === 0) {
      alert('请先选择要打印的题目');
      return;
    }

    const printContent = selected.map((q, index) => {
      let content = `${index + 1}. ${q.questionText}\n`;
      if (q.options && q.options.length > 0) {
        q.options.forEach(opt => {
          content += `   ${opt.key}. ${opt.text}\n`;
        });
      }
      content += `   正确答案：${q.correctAnswer}\n`;
      if (q.explanation) {
        content += `   解析：${q.explanation}\n`;
      }
      content += '\n';
      return content;
    }).join('\n');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>打印练习题</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }
            .question { margin-bottom: 20px; }
            .answer { color: #666; }
          </style>
        </head>
        <body>
          <pre>${printContent}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Container maxWidth="md" className="app-main-container">
      <Container maxWidth="md" sx={{ mt: 2 }}>
        <Paper className="upload-area-container">
          <Typography variant="h5" className="upload-area-title" gutterBottom>
            <PlusCircle size={24} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
            AI智能题目生成器
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>学科 *</InputLabel>
                <Select
                  value={subject}
                  label="学科 *"
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map(s => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>难度</InputLabel>
                <Select
                  value={difficulty}
                  label="难度"
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {difficulties.map(d => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="题目主题或知识点 *"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：一元一次方程、阅读理解、英语语法等"
                InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={generateSingleQuestion}
            disabled={loading || !subject || !topic}
            startIcon={loading ? <CircularProgress size={20} /> : <PlusCircle size={16} />}
            sx={{ mb: 3, px: 3, py: 1 }}
          >
            {loading ? '生成中...' : '生成题目'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {generatedQuestion && (
            <Paper className="ocr-result-container" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                生成的题目：
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>题目：</strong> {generatedQuestion.question}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>答案：</strong> {generatedQuestion.answer}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>解析：</strong> {generatedQuestion.explanation}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={addToGeneratedList}
                  startIcon={<PlusCircle size={16} />}
                >
                  添加到列表
                </Button>
                <Button
                  variant="outlined"
                  onClick={generateSingleQuestion}
                  startIcon={<RotateCcw size={16} />}
                >
                  重新生成
                </Button>
              </Box>
            </Paper>
          )}

          {generatedQuestions.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" className="form-section-title" gutterBottom>
                  <RotateCcw size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  已生成的题目列表 ({generatedQuestions.length})
                </Typography>
                {selectedQuestions.size > 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={printSelectedQuestions}
                    startIcon={<Printer size={16} />}
                  >
                    打印选中的题目 ({selectedQuestions.size})
                  </Button>
                )}
              </Box>
              {generatedQuestions.map((q, index) => (
                <Paper key={q._id || index} className="ocr-result-container" sx={{ mb: 2, border: selectedQuestions.has(q._id) ? '2px solid #1976d2' : 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Checkbox
                          checked={selectedQuestions.has(q._id)}
                          onChange={() => toggleQuestionSelection(q._id)}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body1" gutterBottom sx={{ mb: 0 }}>
                          <strong>{index + 1}. {q.questionText}</strong>
                        </Typography>
                      </Box>
                      {q.options && q.options.length > 0 && (
                        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {q.options.map((opt, optIdx) => (
                            <Typography key={optIdx} variant="body2" sx={{ 
                              mb: 0.5, 
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
                      <Typography variant="body2" gutterBottom sx={{ pl: 4 }}>
                        <strong>正确答案：</strong> {q.correctAnswer}
                      </Typography>
                      {q.explanation && (
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ pl: 4 }}>
                          <strong>解析：</strong> {q.explanation}
                        </Typography>
                      )}
                      {q.targetError && (
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ pl: 4 }}>
                          <strong>针对错误：</strong> {q.targetError}
                        </Typography>
                      )}
                      {q.practicePoint && (
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                          <strong>练习知识点：</strong> {q.practicePoint}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      onClick={() => deleteQuestion(q._id)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Container>
    </Container>
  );
}

export default Generator;