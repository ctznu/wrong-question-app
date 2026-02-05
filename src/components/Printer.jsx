import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent, Checkbox, FormControlLabel, Paper, Chip, Alert, Collapse, IconButton } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Printer as PrinterIcon, Filter, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';

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

const getSemesterOptions = () => {
  const currentGrade = localStorage.getItem('currentGrade');
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

function Printer({ questions }) {
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [selectedGeneratedQuestions, setSelectedGeneratedQuestions] = useState(new Set());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [generatedQuestionsMap, setGeneratedQuestionsMap] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  const semesters = getSemesterOptions();

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
    return (!selectedSubject || q.subject === selectedSubject) &&
           (!selectedSemester || q.semester === selectedSemester);
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
      alert('请至少选择一道题目');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfContent = document.createElement('div');
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '0';
    pdfContent.style.width = '210mm';
    pdfContent.style.padding = '20mm';
    pdfContent.style.fontFamily = 'SimSun, SimHei, Microsoft YaHei, sans-serif';
    pdfContent.style.fontSize = '12pt';
    pdfContent.style.lineHeight = '1.5';

    let contentHtml = `
      <h1>错题练习</h1>
      <p>生成时间: ${new Date().toLocaleDateString()}</p>
      <p>原题数量: ${selectedQuestions.size}</p>
      <p>生成题数量: ${selectedGeneratedQuestions.size}</p>
      <br/>
    `;

    let questionIndex = 1;
    const answers = [];

    selectedQuestions.forEach(id => {
      const question = questions.find(q => (q._id || q.id) === id);
      if (question) {
        contentHtml += `<h3>${questionIndex}. ${question.question}</h3>`;
        if (question.options && question.options.length > 0) {
          contentHtml += '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">';
          question.options.forEach((opt, idx) => {
            contentHtml += `<div style="flex: 0 0 auto; text-align: left; word-wrap: break-word; overflow-wrap: break-word;">${opt.key}. ${opt.text}</div>`;
          });
          contentHtml += '</div>';
        }
        contentHtml += '<hr style="margin: 10px 0;">';
        
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
    });

    selectedGeneratedQuestions.forEach(id => {
      Object.values(generatedQuestionsMap).flat().forEach(gq => {
        if (gq._id === id) {
          contentHtml += `<h3>${questionIndex}. ${gq.questionText}</h3>`;
          if (gq.options && gq.options.length > 0) {
            contentHtml += '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0;">';
            gq.options.forEach((opt, idx) => {
              contentHtml += `<div style="flex: 0 0 auto; text-align: left; word-wrap: break-word; overflow-wrap: break-word;">${opt.key}. ${opt.text}</div>`;
            });
            contentHtml += '</div>';
          }
          contentHtml += '<hr style="margin: 10px 0;">';
          
          answers.push({
            index: questionIndex,
            question: gq.questionText,
            answer: gq.correctAnswer,
            explanation: gq.explanation
          });
          questionIndex++;
        }
      });
    });

    pdfContent.innerHTML = contentHtml;
    document.body.appendChild(pdfContent);

    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    document.body.removeChild(pdfContent);

    if (includeAnswers && answers.length > 0) {
      doc.addPage();
      
      const answerContent = document.createElement('div');
      answerContent.style.position = 'absolute';
      answerContent.style.left = '-9999px';
      answerContent.style.top = '0';
      answerContent.style.width = '210mm';
      answerContent.style.padding = '20mm';
      answerContent.style.fontFamily = 'SimSun, SimHei, Microsoft YaHei, sans-serif';
      answerContent.style.fontSize = '12pt';
      answerContent.style.lineHeight = '1.5';

      let answerHtml = `
        <h1>参考答案</h1>
        <p>共 ${answers.length} 道题目</p>
        <br/>
      `;

      answers.forEach(item => {
        answerHtml += `<h3>${item.index}. ${item.question}</h3>`;
        answerHtml += `<p><strong>【答案】</strong> ${item.answer}</p>`;
        if (includeExplanations && item.explanation) {
          answerHtml += `<p><strong>【解析】</strong> ${item.explanation}</p>`;
        }
        answerHtml += '<hr style="margin: 10px 0;">';
      });

      answerContent.innerHTML = answerHtml;
      document.body.appendChild(answerContent);

      const answerCanvas = await html2canvas(answerContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const answerImgData = answerCanvas.toDataURL('image/png');
      const answerImgHeight = (answerCanvas.height * imgWidth) / answerCanvas.width;
      let answerHeightLeft = answerImgHeight;
      let answerPosition = 0;

      doc.addImage(answerImgData, 'PNG', 0, answerPosition, imgWidth, answerImgHeight);
      answerHeightLeft -= pageHeight;

      while (answerHeightLeft >= 0) {
        answerPosition = answerHeightLeft - answerImgHeight;
        doc.addPage();
        doc.addImage(answerImgData, 'PNG', 0, answerPosition, imgWidth, answerImgHeight);
        answerHeightLeft -= pageHeight;
      }

      document.body.removeChild(answerContent);
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
      alert('请至少选择一道题目');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfContent = document.createElement('div');
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '0';
    pdfContent.style.width = '210mm';
    pdfContent.style.padding = '20mm';
    pdfContent.style.fontFamily = 'SimSun, SimHei, Microsoft YaHei, sans-serif';
    pdfContent.style.fontSize = '12pt';
    pdfContent.style.lineHeight = '1.5';

    let contentHtml = `
      <h1>错题练习</h1>
      <p>科目: ${selectedSubject ? subjects.find(s => s.value === selectedSubject)?.label : '全部'}</p>
      <p>学期: ${selectedSemester || '全部'}</p>
      <p>日期: ${new Date().toLocaleDateString()}</p>
      <p>题目数量: ${selectedQuestions.size + selectedGeneratedQuestions.size}</p>
      <br/>
    `;

    let questionIndex = 1;

    selectedQuestions.forEach(id => {
      const question = questions.find(q => (q._id || q.id) === id);
      if (question) {
        contentHtml += `<h3>${questionIndex}. ${question.question}</h3>`;
        if (question.options && question.options.length > 0) {
          contentHtml += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0;">';
          question.options.forEach(opt => {
            contentHtml += `<div style="word-wrap: break-word; overflow-wrap: break-word;">${opt.key}. ${opt.text}</div>`;
          });
          contentHtml += '</div>';
        }
        contentHtml += `<div style="height: 20px; border-bottom: 1px solid black; margin: 20px 0;"></div>`;
        questionIndex++;
      }
    });

    selectedGeneratedQuestions.forEach(id => {
      Object.values(generatedQuestionsMap).flat().forEach(gq => {
        if (gq._id === id) {
          contentHtml += `<h3>${questionIndex}. ${gq.questionText}</h3>`;
          if (gq.options && gq.options.length > 0) {
            contentHtml += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0;">';
            gq.options.forEach(opt => {
              contentHtml += `<div style="word-wrap: break-word; overflow-wrap: break-word;">${opt.key}. ${opt.text}</div>`;
            });
            contentHtml += '</div>';
          }
          contentHtml += `<div style="height: 20px; border-bottom: 1px solid black; margin: 20px 0;"></div>`;
          questionIndex++;
        }
      });
    });

    pdfContent.innerHTML = contentHtml;
    document.body.appendChild(pdfContent);

    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    document.body.removeChild(pdfContent);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    doc.save(`错题练习_${dateStr}.pdf`);
  };

  return (
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
  );
}

export default Printer;
