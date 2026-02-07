import React, { useState } from 'react';
import { Container, Typography, Button, Box, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUpload } from '../../contexts/UploadContext';
import { ERROR_TYPES, SUBJECTS, QUESTION_TYPES } from '../../utils/constants';
import { getCurrentSemester } from '../../utils/formatters';
import ImageUpload from './ImageUpload';
import QuestionForm from './QuestionForm';

function Upload({ addQuestion }) {
  const { user } = useAuth();
  const { formData, setFormData, loading, setLoading, ocrResult, setOcrResult } = useUpload();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [selectedModel, setSelectedModel] = useState('zhipu');
  const [, setLoadingType] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  // 初始化时自动计算学期
  React.useEffect(() => {
    if (user?.currentGrade && !formData.semester) {
      const calculatedSemester = getCurrentSemester(user.currentGrade);
      setFormData(prev => ({ ...prev, semester: calculatedSemester }));
    }
  }, [user?.currentGrade, formData.semester, setFormData]);

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
    // 重置表单数据和OCR结果，避免显示之前的内容
    setOcrError('');
    setOcrResult(null);
    setFormData({
      subject: '',
      semester: '',
      question: '',
      correctAnswer: '',
      wrongAnswer: '',
      reason: '',
      tags: [],
      questionType: '',
      difficulty: 'medium',
      grade: '',
      semesterType: '1'
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview('');
    setOcrError('');
    setOcrResult(null);
    setFormData({
      subject: '',
      semester: '',
      question: '',
      correctAnswer: '',
      wrongAnswer: '',
      reason: '',
      tags: [],
      questionType: '',
      difficulty: 'medium',
      grade: '',
      semesterType: '1'
    });
  };

  const handleOCRWithModel = async (model) => {
    if (!file) return;
    setLoading(true);
    setLoadingType(model);
    setOcrError('');
    setOcrResult(null);
    setFormData({
      subject: '',
      semester: '',
      question: '',
      correctAnswer: '',
      wrongAnswer: '',
      reason: '',
      tags: [],
      questionType: '',
      difficulty: 'medium',
      grade: '',
      semesterType: '1'
    });
    
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
        setOcrResult(null);
      } else {
        setOcrResult(data);
        







        
        const subjectMap = { 'math': 'math', 'chinese': 'chinese', 'english': 'english' };
        if (data.subject && subjectMap[data.subject]) {
          setFormData(prev => ({ ...prev, subject: subjectMap[data.subject] }));
        }
        
        if (data.grade) {
        }
        if (data.semester) {
          const combinedSemester = data.grade ? `${data.grade}-${data.semester}` : data.semester;


          setFormData(prev => ({ ...prev, semester: combinedSemester }));
        } else if (user?.currentGrade) {
          const calculatedSemester = getCurrentSemester(user.currentGrade);

          setFormData(prev => ({ ...prev, semester: calculatedSemester }));
        }
        
        if (data.question) setFormData(prev => ({ ...prev, question: data.question }));
        if (data.correctAnswer) setFormData(prev => ({ ...prev, correctAnswer: data.correctAnswer }));
        if (data.studentAnswer) {
          setFormData(prev => ({ ...prev, wrongAnswer: data.studentAnswer }));
        } else {
        }
        if (data.errorReason) setFormData(prev => ({ ...prev, reason: data.errorReason }));
        if (data.errorType && data.errorType !== 'none') {
          // 映射错误类型到中文标签
          const errorTypeMap = {
            'calculation': '计算错误',
            'concept': '概念不清',
            'reading': '审题错误',
            'careless': '粗心大意',
            'none': '无错误'
          };
          const errorTypeLabel = errorTypeMap[data.errorType] || data.errorType;
          setFormData(prev => ({ ...prev, tags: [errorTypeLabel] }));
        } else {
        }
      }
    } catch (err) {
      setOcrError(err.message || '识别失败，请重试');
      setOcrResult(null);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSave = async () => {
    if (!formData.question || !formData.correctAnswer) {
      setSnackbar({ open: true, message: '请先上传图片并进行OCR识别，或手动填写题目和答案', severity: 'warning' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // 使用环境变量或默认值作为 API 基础 URL
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      
      const response = await fetch(`${apiBaseUrl}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          subject: formData.subject,
          question: formData.question,
          correctAnswer: formData.correctAnswer,
          wrongAnswer: formData.wrongAnswer,
          reason: formData.reason,
          tags: formData.tags,
          questionType: formData.questionType,
          grade: formData.grade,
          semester: formData.semester,
          userId: user?.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbar({ open: true, message: '错题保存成功！', severity: 'success' });
        handleRemoveFile();
        if (addQuestion) {
          addQuestion(result);
        }
        navigate('/');
      } else {
        const errorData = await response.json();
        setSnackbar({ open: true, message: `保存失败: ${errorData.error || '未知错误'}`, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: `保存失败: ${err.message}`, severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" className="app-main-container">
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <ImageUpload
          file={file}
          preview={preview}
          ocrResult={ocrResult}
          onFileChange={handleFileChange}
          onRemove={handleRemoveFile}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOCR={() => handleOCRWithModel(selectedModel)}
          loading={loading}
        />

        {file && (
          <Box className="form-section">
            {ocrError && (
              <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {ocrError}
              </Alert>
            )}

            {ocrResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>智能识别完成</strong><br/>
                学科: {SUBJECTS.find(s => s.value === ocrResult.subject)?.label || ocrResult.subject} |
                题目类型: {QUESTION_TYPES.find(q => q.value === ocrResult.questionType)?.label || ocrResult.questionType} |
                置信度: {(ocrResult.confidence * 100).toFixed(0)}%<br/>
                {ocrResult.isWrong && <span style={{color: '#d32f2f'}}>识别到错误答案（{ERROR_TYPES.find(t => t.value === ocrResult.errorType)?.label || ocrResult.errorType}）</span>}
              </Alert>
            )}

            {ocrResult && ocrResult.reasoningSteps && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>推理步骤：</strong><br/>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                  {ocrResult.reasoningSteps}
                </Typography>
              </Alert>
            )}

            <QuestionForm
              formData={formData}
              onChange={(field, value) => {
                setFormData(prev => ({ ...prev, [field]: value }));
              }}
              user={user}
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleRemoveFile}
                startIcon={<X size={16} />}
              >
                取消
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!formData.question || !formData.correctAnswer || loading}
                startIcon={<Save size={16} />}
              >
                保存错题
              </Button>
            </Box>
          </Box>
        )}
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Upload;