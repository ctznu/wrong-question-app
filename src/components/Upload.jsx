import React, { useState, useEffect } from 'react';
import OcrOverlay from './OcrOverlay';
import { Container, Typography, Button, Box, TextField, Select, MenuItem, FormControl, InputLabel, Alert, Paper, InputAdornment, IconButton, Checkbox, FormControlLabel, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const QwenLogo = () => (
  <img 
    src="https://img.alicdn.com/imgextra/i1/O1CN013ltlI61OTOnTStXfj_!!6000000001706-55-tps-330-327.svg" 
    alt="Qwen" 
    width="20" 
    height="20"
    style={{ display: 'block' }}
  />
);

const DeepSeekLogo = () => (
  <img 
    src="https://cdn.deepseek.com/platform/favicon.png" 
    alt="DeepSeek" 
    width="20" 
    height="20"
    style={{ display: 'block' }}
  />
);

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

const questionTypes = {
  'single_choice': '单选题',
  'multiple_choice': '多选题',
  'fill_blank': '填空题',
  'short_answer': '简答题',
  'calculation': '计算题',
  'unknown': '未知'
};

const errorTypes = {
  'calculation': '计算错误',
  'concept': '概念不清',
  'reading': '审题错误',
  'careless': '粗心大意',
  'unknown': '未知'
};

const llmModels = [
  { value: 'zhipu', label: '智谱AI', color: '#4D6BFE' },
  { value: 'tongyi', label: '通义千问', color: '#FF6B6B' },
  { value: 'hunyuan', label: '腾讯混元', color: '#0052D9' },
  { value: 'ollama', label: '本地Ollama', color: '#10B981' }
];

function Upload({ addQuestion }) {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [tags, setTags] = useState([]);
  const [focusedField, setFocusedField] = useState('');
  const [selectedModel, setSelectedModel] = useState('zhipu');
  const navigate = useNavigate();

  const getCurrentSemester = () => {
    const currentGrade = user?.currentGrade;
    if (!currentGrade) return '';
    
    const now = new Date();
    const month = now.getMonth() + 1;
    
    if (month >= 9 || month <= 2) {
      return `${currentGrade}-上`;
    } else {
      return `${currentGrade}-下`;
    }
  };

  const getSemesterOptions = () => {
    const currentGrade = user?.currentGrade;
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

  const semesters = getSemesterOptions();

  useEffect(() => {
    if (user?.currentGrade) {
      setSemester(getCurrentSemester());
    }
  }, [user?.currentGrade]);

  const getSubjectLabel = (value) => {
    const found = subjects.find(s => s.value === value);
    return found ? found.label : value || '未知';
  };

  const getQuestionTypeLabel = (value) => {
    return questionTypes[value] || value || '未知';
  };

  const getErrorTypeLabel = (value) => {
    return errorTypes[value] || value || '未知';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleTagChange = (tag, checked) => {
    if (checked) {
      setTags([...tags, tag]);
    } else {
      setTags(tags.filter(t => t !== tag));
    }
  };

  const handleQwenOCR = async () => {
    await handleOCRWithModel('tongyi');
  };

  const handleDeepSeekOCR = async () => {
    await handleOCRWithModel('ollama');
  };

  const handleOCRWithModel = async (model) => {
    if (!file) return;
    setLoading(true);
    setLoadingType(model);
    setOcrError('');
    setRecognizedText('');
    setSubject('');
    setQuestion('');
    setCorrectAnswer('');
    setWrongAnswer('');
    setReason('');
    setTags([]);
    setParsedResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);
      
      const resp = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      
      if (!resp.ok) {
        setOcrError(data.error || '服务返回错误');
        setRecognizedText('识别失败，请查看错误信息');
      } else {
        setRecognizedText(data.ocr_text || '');
        setParsedResult(data);
        
        console.log('识别结果:', data);
        console.log('视觉识别来源:', data.vision_source || data.llm_source);
        console.log('推理分析来源:', data.reasoning_source);
        console.log('OCR返回的grade:', data.grade);
        console.log('OCR返回的semester:', data.semester);
        console.log('OCR返回的grade类型:', typeof data.grade);
        console.log('OCR返回的semester类型:', typeof data.semester);
        
        // 自动填充表单
        const subjectMap = { 'math': 'math', 'chinese': 'chinese', 'english': 'english' };
        if (data.subject && subjectMap[data.subject]) {
          setSubject(subjectMap[data.subject]);
        }
        
        // 年级和学期
        if (data.grade) {
          console.log('识别的年级:', data.grade);
        }
        if (data.semester) {
          console.log('识别的学期:', data.semester);
          const combinedSemester = data.grade ? `${data.grade}-${data.semester}` : data.semester;
          console.log('合并后的学期:', combinedSemester);
          console.log('可用的学期选项:', semesters);
          setSemester(combinedSemester);
        } else if (user?.currentGrade) {
          const calculatedSemester = getCurrentSemester();
          console.log('使用前端计算的学期:', calculatedSemester);
          setSemester(calculatedSemester);
        }
        
        // 题目内容
        if (data.question) setQuestion(data.question);
        
        // 正确答案
        if (data.correctAnswer) setCorrectAnswer(data.correctAnswer);
        
        // 学生答案
        if (data.studentAnswer) {
          console.log('设置错误答案为:', data.studentAnswer);
          setWrongAnswer(data.studentAnswer);
        } else {
          console.log('studentAnswer为空，不设置错误答案');
        }
        
        // 错误原因
        if (data.errorReason) setReason(data.errorReason);
        
        // 错误类型标签
        if (data.errorType && data.errorType !== 'none') {
          const errorTypeLabel = errorTypes[data.errorType] || '其他';
          console.log('设置错误类型标签:', errorTypeLabel);
          setTags([errorTypeLabel]);
        } else {
          console.log('errorType为空或none，不设置标签');
        }
      }
    } catch (err) {
      console.error(`${model} OCR 请求失败:`, err);
      setOcrError(err.message || String(err));
      setRecognizedText('识别失败：网络或服务未启动');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSubmit = async () => {
    const newQuestion = {
      subject,
      semester,
      question,
      correctAnswer,
      wrongAnswer,
      reason,
      tags: tags,
      imageUrl: preview,
      createdAt: new Date().toISOString().split('T')[0],
      similarQuestions: []
    };

    try {
      await addQuestion(newQuestion);
      navigate('/');
    } catch (error) {
      console.error('保存错题失败:', error);
      setOcrError('保存错题失败: ' + error.message);
    }
  };

  return (
    <Container maxWidth="md" className="app-main-container">
      <Container maxWidth="md" sx={{ mt: 2 }}>
        <Paper className="upload-area-container">
          <Typography variant="h5" className="upload-area-title" gutterBottom>
            <UploadIcon size={24} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
            上传错题照片
          </Typography>

          <Box sx={{ mb: 3 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="file-input"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon size={16} />}
                sx={{ px: 3, py: 1 }}
              >
                选择图片文件
              </Button>
            </label>
            {preview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                {parsedResult ? (
                  <div>
                    <OcrOverlay
                      imageSrc={preview}
                      words={parsedResult.words || []}
                      blocks={parsedResult.blocks || []}
                      onSelect={(s) => {
                        if (s && s.text) {
                          setQuestion(prev => prev ? prev + '\n' + s.text : s.text);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="preview-image"
                  />
                )}
              </Box>
            )}
            {preview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                  <FormControl>
                    <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>AI模型</InputLabel>
                    <Select
                      value={selectedModel}
                      label="AI模型"
                      onChange={(e) => setSelectedModel(e.target.value)}
                      sx={{ minWidth: 200 }}
                    >
                      {llmModels.map(m => (
                        <MenuItem key={m.value} value={m.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: m.color }} />
                            {m.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={() => handleOCRWithModel(selectedModel)}
                    disabled={loading}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? '识别中...' : `使用 ${llmModels.find(m => m.value === selectedModel)?.label || 'AI'} 识别`}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {file && (
            <Box className="form-section">
              {ocrError && (
                <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {ocrError}
                </Alert>
              )}

              {parsedResult && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <strong>智能识别完成</strong><br/>
                  学科: {getSubjectLabel(parsedResult.subject)} |
                  题目类型: {getQuestionTypeLabel(parsedResult.questionType)} |
                  置信度: {(parsedResult.confidence * 100).toFixed(0)}%<br/>
                  {parsedResult.isWrong && <span style={{color: '#d32f2f'}}>识别到错误答案（{getErrorTypeLabel(parsedResult.errorType)}）</span>}
                </Alert>
              )}

              {parsedResult && parsedResult.reasoningSteps && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>推理步骤：</strong><br/>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                    {parsedResult.reasoningSteps}
                  </Typography>
                </Alert>
              )}

              {!user?.currentGrade && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  请先在<a href="/settings" style={{ textDecoration: 'underline' }}>设置页面</a>设置当前年级，以便系统自动计算学期
                </Alert>
              )}

              {/* 学科和学期一起占一行 */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                <FormControl>
                  <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>学科 *</InputLabel>
                  <Select
                    value={subject}
                    label="学科 *"
                    onChange={(e) => setSubject(e.target.value)}
                    sx={{ minWidth: 200 }}
                  >
                    {subjects.map(s => (
                      <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>学期</InputLabel>
                  <Select
                    value={semester}
                    label="学期"
                    onChange={(e) => setSemester(e.target.value)}
                    sx={{ minWidth: 200 }}
                  >
                    {semesters.map(s => {
                      const [grade, semesterType] = s.split('-');
                      return (
                        <MenuItem key={s} value={s}>{getGradeLabel(grade)}-{semesterType}</MenuItem>
                      );
                    })}
                    </Select>
                </FormControl>
              </Box>

              {/* 题目内容单独占一行 */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="题目内容 *"
                  multiline
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="请输入题目内容..."
                  InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  InputProps={{
                    endAdornment: question && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => setQuestion('')} 
                          edge="end"
                          sx={{ 
                            opacity: focusedField === 'question' ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                          onMouseEnter={() => setFocusedField('question')}
                          onMouseLeave={() => setFocusedField('')}
                        >
                          <X size={16} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  onFocus={() => setFocusedField('question')}
                  onBlur={() => setFocusedField('')}
                />
              </Box>

              {/* 正确答案和错误答案放在一行，各占50% */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="正确答案 *"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="请输入正确答案..."
                  InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  InputProps={{
                    endAdornment: correctAnswer && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => setCorrectAnswer('')} 
                          edge="end"
                          sx={{ 
                            opacity: focusedField === 'correctAnswer' ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                          onMouseEnter={() => setFocusedField('correctAnswer')}
                          onMouseLeave={() => setFocusedField('')}
                        >
                          <X size={16} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  onFocus={() => setFocusedField('correctAnswer')}
                  onBlur={() => setFocusedField('')}
                />
                <TextField
                  fullWidth
                  label="错误答案"
                  value={wrongAnswer}
                  onChange={(e) => setWrongAnswer(e.target.value)}
                  placeholder="请输入学生的错误答案..."
                  InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  InputProps={{
                    endAdornment: wrongAnswer && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => setWrongAnswer('')} 
                          edge="end"
                          sx={{ 
                            opacity: focusedField === 'wrongAnswer' ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                          onMouseEnter={() => setFocusedField('wrongAnswer')}
                          onMouseLeave={() => setFocusedField('')}
                        >
                          <X size={16} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  onFocus={() => setFocusedField('wrongAnswer')}
                  onBlur={() => setFocusedField('')}
                />
              </Box>

              {/* 错误原因单独占一行，占满整行 */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="错误原因"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入错误原因分析..."
                  InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
                  InputProps={{
                    endAdornment: reason && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => setReason('')} 
                          edge="end"
                          sx={{ 
                            opacity: focusedField === 'reason' ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                          onMouseEnter={() => setFocusedField('reason')}
                          onMouseLeave={() => setFocusedField('')}
                        >
                          <X size={16} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  onFocus={() => setFocusedField('reason')}
                  onBlur={() => setFocusedField('')}
                />
              </Box>

              {/* 标签单独占一行，支持多选 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  错误类型
                </Typography>
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={<Checkbox checked={tags.includes('计算错误')} onChange={(e) => handleTagChange('计算错误', e.target.checked)} />}
                    label="计算错误"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={tags.includes('概念不清')} onChange={(e) => handleTagChange('概念不清', e.target.checked)} />}
                    label="概念不清"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={tags.includes('审题错误')} onChange={(e) => handleTagChange('审题错误', e.target.checked)} />}
                    label="审题错误"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={tags.includes('粗心大意')} onChange={(e) => handleTagChange('粗心大意', e.target.checked)} />}
                    label="粗心大意"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={tags.includes('其他')} onChange={(e) => handleTagChange('其他', e.target.checked)} />}
                    label="其他"
                  />
                </Stack>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              startIcon={<X size={16} />}
            >
              取消
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!subject || !question}
              startIcon={<Save size={16} />}
            >
              保存错题
            </Button>
          </Box>
        </Paper>
      </Container>
    </Container>
  );
}

export default Upload;
