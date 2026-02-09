import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent, Checkbox, FormControlLabel, Paper, Chip, Alert, Collapse, Snackbar } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Printer as PrinterIcon, Filter, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = 'http://106.14.163.150:5001/api';

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

const getSemesterOptions = (currentGrade) => {
  if (!currentGrade) return [];
  
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

function Printer({ questions }) {
  const { user } = useAuth();
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [selectedGeneratedQuestions, setSelectedGeneratedQuestions] = useState(new Set());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [generatedQuestionsMap, setGeneratedQuestionsMap] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const semesters = getSemesterOptions(user?.currentGrade);

  useEffect(() => {
    loadGeneratedQuestions();
  }, [questions]);

  const loadGeneratedQuestions = async () => {
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
        const map = {};
        data.forEach(gq => {
          const originalId = gq.originalQuestionId;
          if (!map[originalId]) {
            map[originalId] = [];
          }
          map[originalId].push(gq);
        });
        setGeneratedQuestionsMap(map);
      }
    } catch (err) {
      console.error('获取生成的题目失败:', err);
    }
  };

  const filteredQuestions = questions.filter(q => {
    return (
      (!selectedSubject || q.subject === selectedSubject) &&
      (!selectedSemester || q.semester === selectedSemester)
    );
  });

  const handleSelectQuestion = (id) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectGeneratedQuestion = (id) => {
    setSelectedGeneratedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleExpand = (questionId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const selectAllOriginal = () => {
    const allIds = filteredQuestions.map(q => q._id || q.id);
    setSelectedQuestions(new Set(allIds));
  };

  const clearAllOriginal = () => {
    setSelectedQuestions(new Set());
  };

  const selectAllGenerated = () => {
    const allGeneratedIds = [];
    filteredQuestions.forEach(q => {
      const qId = q._id || q.id;
      const generated = generatedQuestionsMap[qId] || [];
      generated.forEach(g => allGeneratedIds.push(g._id));
    });
    setSelectedGeneratedQuestions(new Set(allGeneratedIds));
  };

  const clearAllGenerated = () => {
    setSelectedGeneratedQuestions(new Set());
  };

  const generatePDF = async () => {
    if (selectedQuestions.size === 0 && selectedGeneratedQuestions.size === 0) {
      setSnackbar({ open: true, message: '请至少选择一道题目', severity: 'warning' });
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;
    let questionIndex = 1;
    const answers = [];

    const addPageIfNeeded = (requiredHeight) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    const addHtmlAsImage = async (html, requiredHeight) => {
      addPageIfNeeded(requiredHeight);
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = `${contentWidth}mm`;
      container.style.padding = '0';
      container.style.fontFamily = 'SimSun, SimHei, Microsoft YaHei, sans-serif';
      container.style.fontSize = '12pt';
      container.style.lineHeight = '1.5';
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
      currentY += imgHeight + 5;
      
      document.body.removeChild(container);
      return imgHeight;
    };

    const headerHtml = `
      <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
        <h1 style="font-size: 20px; margin: 0 0 10px 0;">错题练习</h1>
        <p style="font-size: 12px; margin: 5px 0;">生成时间: ${new Date().toLocaleDateString()}</p>
        <p style="font-size: 12px; margin: 5px 0;">原题数量: ${selectedQuestions.size}</p>
        <p style="font-size: 12px; margin: 5px 0;">生成题数量: ${selectedGeneratedQuestions.size}</p>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #000;">
      </div>
    `;
    await addHtmlAsImage(headerHtml, 40);

    for (const id of selectedQuestions) {
      const question = questions.find(q => (q._id || q.id) === id);
      if (question) {
        const questionHtml = `
          <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
            <h3 style="font-size: 14px; margin: 10px 0 5px 0;">${questionIndex}. ${question.question}</h3>
            ${question.options && question.options.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">
                ${question.options.map(opt => `
                  <div style="flex: 0 0 auto; text-align: left; font-size: 12px;">${opt.key}. ${opt.text}</div>
                `).join('')}
              </div>
            ` : ''}
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #ccc;">
          </div>
        `;
        await addHtmlAsImage(questionHtml, 50);
        
        if (question.correctAnswer) {
          answers.push({
            index: questionIndex,
            question: question.question,
            answer: question.correctAnswer,
            explanation: question.reason
          });
        }
        questionIndex++;
      }
    }

    for (const id of selectedGeneratedQuestions) {
      for (const gq of Object.values(generatedQuestionsMap).flat()) {
        if (gq._id === id) {
          const questionHtml = `
            <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
              <h3 style="font-size: 14px; margin: 10px 0 5px 0;">${questionIndex}. ${gq.questionText}</h3>
              ${gq.options && gq.options.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">
                  ${gq.options.map(opt => `
                    <div style="flex: 0 0 auto; text-align: left; font-size: 12px;">${opt.key}. ${opt.text}</div>
                  `).join('')}
                </div>
              ` : ''}
              <hr style="margin: 10px 0; border: none; border-top: 1px solid #ccc;">
            </div>
          `;
          await addHtmlAsImage(questionHtml, 50);
          
          answers.push({
            index: questionIndex,
            question: gq.questionText,
            answer: gq.correctAnswer,
            explanation: gq.explanation
          });
          questionIndex++;
        }
      }
    }

    if (includeAnswers && answers.length > 0) {
      doc.addPage();
      currentY = margin;
      
      const answerHeaderHtml = `
        <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
          <h1 style="font-size: 20px; margin: 0 0 10px 0;">参考答案</h1>
          <p style="font-size: 12px; margin: 5px 0;">共 ${answers.length} 道题目</p>
          <hr style="margin: 10px 0; border: none; border-top: 1px solid #000;">
        </div>
      `;
      await addHtmlAsImage(answerHeaderHtml, 40);

      for (const item of answers) {
        const answerHtml = `
          <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
            <h3 style="font-size: 12px; margin: 10px 0 5px 0;">${item.index}. 【答案】${item.answer}</h3>
            ${includeExplanations && item.explanation ? `
              <p style="font-size: 12px; margin: 5px 0;"><strong>【解析】</strong> ${item.explanation}</p>
            ` : ''}
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #ccc;">
          </div>
        `;
        await addHtmlAsImage(answerHtml, 50);
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    doc.save(`错题练习_${dateStr}.pdf`);
  };

  const generateWorksheetPDF = async () => {
    if (selectedQuestions.size === 0 && selectedGeneratedQuestions.size === 0) {
      setSnackbar({ open: true, message: '请至少选择一道题目', severity: 'warning' });
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;
    let questionIndex = 1;

    const addPageIfNeeded = (requiredHeight) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    const addHtmlAsImage = async (html, requiredHeight) => {
      addPageIfNeeded(requiredHeight);
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = `${contentWidth}mm`;
      container.style.padding = '0';
      container.style.fontFamily = 'SimSun, SimHei, Microsoft YaHei, sans-serif';
      container.style.fontSize = '12pt';
      container.style.lineHeight = '1.5';
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
      currentY += imgHeight + 5;
      
      document.body.removeChild(container);
      return imgHeight;
    };

    const headerHtml = `
      <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
        <h1 style="font-size: 20px; margin: 0 0 10px 0;">错题练习</h1>
        <p style="font-size: 12px; margin: 5px 0;">科目: ${selectedSubject ? subjects.find(s => s.value === selectedSubject)?.label : '全部'}</p>
        <p style="font-size: 12px; margin: 5px 0;">学期: ${selectedSemester || '全部'}</p>
        <p style="font-size: 12px; margin: 5px 0;">日期: ${new Date().toLocaleDateString()}</p>
        <p style="font-size: 12px; margin: 5px 0;">题目数量: ${selectedQuestions.size + selectedGeneratedQuestions.size}</p>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #000;">
      </div>
    `;
    await addHtmlAsImage(headerHtml, 50);

    for (const id of selectedQuestions) {
      const question = questions.find(q => (q._id || q.id) === id);
      if (question) {
        const questionHtml = `
          <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
            <h3 style="font-size: 14px; margin: 10px 0 5px 0;">${questionIndex}. ${question.question}</h3>
            ${question.options && question.options.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">
                ${question.options.map(opt => `
                  <div style="flex: 0 0 auto; text-align: left; font-size: 12px;">${opt.key}. ${opt.text}</div>
                `).join('')}
              </div>
            ` : ''}
            <div style="height: 20px; border-bottom: 1px solid black; margin: 20px 0;"></div>
          </div>
        `;
        await addHtmlAsImage(questionHtml, 50);
        questionIndex++;
      }
    }

    for (const id of selectedGeneratedQuestions) {
      for (const gq of Object.values(generatedQuestionsMap).flat()) {
        if (gq._id === id) {
          const questionHtml = `
            <div style="font-family: SimSun, SimHei, Microsoft YaHei, sans-serif;">
              <h3 style="font-size: 14px; margin: 10px 0 5px 0;">${questionIndex}. ${gq.questionText}</h3>
              ${gq.options && gq.options.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">
                  ${gq.options.map(opt => `
                    <div style="flex: 0 0 auto; text-align: left; font-size: 12px;">${opt.key}. ${opt.text}</div>
                  `).join('')}
                </div>
              ` : ''}
              <div style="height: 20px; border-bottom: 1px solid black; margin: 20px 0;"></div>
            </div>
          `;
          await addHtmlAsImage(questionHtml, 50);
          questionIndex++;
        }
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    doc.save(`错题练习_${dateStr}.pdf`);
  };

  return (
    <>
      <Container maxWidth="md" className="app-main-container">
        <Container maxWidth="md" sx={{ mt: 2 }}>
          <Paper className="upload-area-container">
            <Typography variant="h5" className="upload-area-title" gutterBottom>
              <PrinterIcon size={24} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
              打印和PDF导出
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ minWidth: 120, bgcolor: 'white', px: 0.5 }}><Filter size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} /> 选择学科</InputLabel>
                  <Select
                    value={selectedSubject}
                    label="选择学科"
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="">全部学科</MenuItem>
                    {subjects.map(s => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ minWidth: 120, bgcolor: 'white', px: 0.5 }}><BookOpen size={16} style={{verticalAlign: 'middle', marginRight: '6px'}} /> 选择学期</InputLabel>
                  <Select
                    value={selectedSemester}
                    label="选择学期"
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="">全部学期</MenuItem>
                    {semesters.map(s => {
                      const [grade, semesterType] = s.split('-');
                      return (
                        <MenuItem key={s} value={s}>{getGradeLabel(grade)}-{semesterType}</MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={selectAllOriginal}>
                全选原题
              </Button>
              <Button variant="outlined" onClick={clearAllOriginal}>
                清空原题
              </Button>
              <Button variant="outlined" onClick={selectAllGenerated}>
                全选生成题
              </Button>
              <Button variant="outlined" onClick={clearAllGenerated}>
                清空生成题
              </Button>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeAnswers}
                    onChange={(e) => setIncludeAnswers(e.target.checked)}
                  />
                }
                label="包含答案"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeExplanations}
                    onChange={(e) => setIncludeExplanations(e.target.checked)}
                  />
                }
                label="包含解析"
              />
            </Box>

            <Typography variant="h6" className="form-section-title" gutterBottom>
              选择要导出的题目：
            </Typography>

            {filteredQuestions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                没有找到符合条件的题目
              </Alert>
            ) : (
              filteredQuestions.map(question => {
                const subjectInfo = subjects.find(s => s.value === question.subject) || subjects[0];
                const qId = question._id || question.id;
                const generatedQuestions = generatedQuestionsMap[qId] || [];
                const isExpanded = expandedQuestions.has(qId);

                return (
                  <Card key={qId} className="question-card" sx={{ mb: 2 }}>
                    <CardContent className="question-card-content">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Checkbox
                              checked={selectedQuestions.has(qId)}
                              onChange={() => handleSelectQuestion(qId)}
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={subjectInfo.label}
                              size="small"
                              className={`subject-chip ${subjectInfo.color}`}
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatSemester(question.semester)}
                            </Typography>
                          </Box>
                          <Typography variant="body1" className="question-preview">
                            {question.question}
                          </Typography>
                        </Box>
                      </Box>

                      {generatedQuestions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            onClick={() => toggleExpand(qId)}
                            startIcon={isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                          >
                            关联的类似题目 ({generatedQuestions.length})
                          </Button>
                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2, ml: 3, borderLeft: '2px solid #e0e0e0', pl: 2 }}>
                              {generatedQuestions.map((gq, idx) => (
                                <Box key={gq._id} sx={{ mb: 2, pb: 2, borderBottom: idx < generatedQuestions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <Checkbox
                                      checked={selectedGeneratedQuestions.has(gq._id)}
                                      onChange={() => handleSelectGeneratedQuestion(gq._id)}
                                      sx={{ mr: 1, mt: -0.5 }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" gutterBottom>
                                        <strong>练习题 {idx + 1}：</strong> {gq.questionText}
                                      </Typography>
                                      {gq.options && gq.options.length > 0 && (
                                        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                          {gq.options.map((opt, optIdx) => (
                                            <Typography key={optIdx} variant="caption" sx={{ 
                                              display: 'block',
                                              ml: 1,
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
                                      <Typography variant="caption" color="text.secondary">
                                        正确答案：{gq.correctAnswer}
                                      </Typography>
                                      {gq.targetError && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          针对错误：{gq.targetError}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Collapse>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}

            {(selectedQuestions.size > 0 || selectedGeneratedQuestions.size > 0) && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={generatePDF}
                  startIcon={<Download size={16} />}
                >
                  下载错题练习（含答案）
                </Button>
                <Button
                  variant="outlined"
                  onClick={generateWorksheetPDF}
                  startIcon={<PrinterIcon size={16} />}
                >
                  下载错题练习（无答案）
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  已选择 {selectedQuestions.size} 道原题，{selectedGeneratedQuestions.size} 道生成题
                </Typography>
              </Box>
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

export default Printer;
