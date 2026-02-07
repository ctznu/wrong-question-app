import { createContext, useContext, useState } from 'react';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateMultipleFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const resetFormData = () => {
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

  const value = {
    formData,
    setFormData,
    updateFormData,
    updateMultipleFormData,
    resetFormData,
    loading,
    setLoading,
    ocrResult,
    setOcrResult
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
};
