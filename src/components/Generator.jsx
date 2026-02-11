import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Alert, Paper, Checkbox, IconButton, Snackbar } from '@mui/material';
import { PlusCircle, Printer, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';

function Generator() {
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchGeneratedQuestions();
  }, []);

  const fetchGeneratedQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/generated-questions`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestions(data);
      }
    } catch (err) {
      console.error('获取生成的题目失败:', err);
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/generated-questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
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
      setSnackbar({ open: true, message: '请先选择要打印的题目', severity: 'warning' });
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
    <>
      <Container maxWidth="md" className="app-main-container" sx={{ px: { xs: 0, sm: 2 } }}>
        <Container maxWidth="md" sx={{ mt: 2, px: { xs: 0, sm: 2 } }}>
          <Paper className="upload-area-container" sx={{ mx: { xs: 0, sm: 'auto' } }}>
            <Typography variant="h5" className="upload-area-title" gutterBottom>
              <PlusCircle size={24} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
              生成的题目列表 ({generatedQuestions.length})
            </Typography>

            {generatedQuestions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                暂无生成的题目
              </Alert>
            ) : (
              <>
                {selectedQuestions.size > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={printSelectedQuestions}
                      startIcon={<Printer size={16} />}
                    >
                      打印选中的题目 ({selectedQuestions.size})
                    </Button>
                  </Box>
                )}
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
                          <Typography variant="body2" gutterBottom sx={{ pl: 4, fontSize: '0.85rem', color: 'text.secondary' }}>
                            <strong>解析：</strong> {q.explanation}
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
              </>
            )}
          </Paper>
        </Container>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Generator;