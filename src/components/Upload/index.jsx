import React, { useState } from 'react';
import { Container, Typography, Button, Box, Alert, Paper, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUpload } from '../../contexts/UploadContext';
import { ERROR_TYPES } from '../../utils/constants';
import { getSemesterOptions } from '../../utils/formatters';
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

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
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
        
        console.log('识别结果:', data);
        console.log('视觉识别来源:', data.vision_source || data.llm_source);
        console.log('推理分析来源:', data.reasoning_source);
        console.log('OCR返回的grade:', data.grade);
        console.log('OCR返回的semester:', data.semester);
        console.log('OCR返回的grade类型:', typeof data.grade);
        console.log('OCR返回的semester类型:', typeof data.semester);
        
        const subjectMap = { 'math': 'math', 'chinese': 'chinese', 'english': 'english' };
        if (data.subject && subjectMap[data.subject]) {
          setFormData(prev => ({ ...prev, subject: subjectMap[data.subject] }));
        }
        
        if (data.grade) {
          console.log('识别的年级:', data.grade);
        }
        if (data.semester) {
          const combinedSemester = data.grade ? `${data.grade}-${data.semester}` : data.semester;
          console.log('合并后的学期:', combinedSemester);
          console.log('可用的学期选项:', getSemesterOptions(user?.currentGrade));
          setFormData(prev => ({ ...prev, semester: combinedSemester }));
        } else if (user?.currentGrade) {
          const calculatedSemester = getCurrentSemester();
          console.log('使用前端计算的学期:', calculatedSemester);
          setFormData(prev => ({ ...prev, semester: calculatedSemester }));
        }
        
        if (data.question) setFormData(prev => ({ ...prev, question: data.question }));
        if (data.correctAnswer) setFormData(prev => ({ ...prev, correctAnswer: data.correctAnswer }));
        if (data.studentAnswer) {
          console.log('设置错误答案为:', data.studentAnswer);
          setFormData(prev => ({ ...prev, wrongAnswer: data.studentAnswer }));
        } else {
          console.log('studentAnswer为空，不设置错误答案');
        }
        if (data.errorReason) setFormData(prev => ({ ...prev, reason: data.errorReason }));
        if (data.errorType && data.errorType !== 'none') {
          const errorTypeLabel = ERROR_TYPES.find(t => t.value === data.errorType)?.label || '其他';
          console.log('设置错误类型标签:', errorTypeLabel);
          setFormData(prev => ({ ...prev, tags: [errorTypeLabel] }));
        } else {
          console.log('errorType为空或none，不设置标签');
        }
      }
    } catch (err) {
      console.error('OCR 请求失败:', err);
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
      const response = await fetch('http://localhost:5001/api/questions', {
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
        console.log('保存成功:', result);
        setSnackbar({ open: true, message: '错题保存成功！', severity: 'success' });
        handleRemoveFile();
        if (addQuestion) {
          addQuestion(result);
        }
        navigate('/');
      } else {
        const errorData = await response.json();
        console.error('保存失败:', errorData);
        setSnackbar({ open: true, message: `保存失败: ${errorData.error || '未知错误'}`, severity: 'error' });
      }
    } catch (err) {
      console.error('保存请求失败:', err);
      setSnackbar({ open: true, message: `保存失败: ${err.message}`, severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" className="app-main-container">
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <ImageUpload
          file={file}
          preview={preview}
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
                学科: {ocrResult.subject} |
                题目类型: {ocrResult.questionType} |
                置信度: {(ocrResult.confidence * 100).toFixed(0)}%<br/>
                {ocrResult.isWrong && <span style={{color: '#d32f2f'}}>识别到错误答案（{ocrResult.errorType}）</span>}
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