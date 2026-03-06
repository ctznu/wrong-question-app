import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Upload as UploadIcon } from 'lucide-react';
import { LLM_MODELS } from '../../utils/constants';
import OcrOverlay from '../OcrOverlay';
import ClaySelect from '../ClaySelect';

function ImageUpload({ file, preview, onFileChange, onRemove, selectedModel, onModelChange, onOCR, loading, ocrResult }) {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const handleSelectOcrText = (selected) => {
    if (selected && selected.text) {
      // This would need to be handled by the parent component
    }
  };

  return (
    <Paper className="upload-area-container">
      <Typography variant="h6" className="upload-area-title" gutterBottom>
        上传错题照片
      </Typography>
      <Box className="upload-area">
        {preview ? (
          <Box className="preview-container" sx={{ position: 'relative' }}>
            {ocrResult ? (
              <OcrOverlay
                imageSrc={preview}
                words={ocrResult.words || []}
                blocks={ocrResult.blocks || []}
                onSelect={handleSelectOcrText}
                sx={{ maxWidth: '100%', height: 'auto' }}
              />
            ) : (
              <img 
                src={preview} 
                alt="预览" 
                className="preview-image" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onRemove}
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
            >
              移除
            </Button>
          </Box>
        ) : (
          <Box className="upload-placeholder" sx={{ py: 4, px: 2 }}>
            <UploadIcon size={48} color="#9e9e9e" />
            <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
              点击或拖拽上传图片
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
              style={{ width: '100%' }}
            />
          </Box>
        )}
      </Box>
      {preview && (
        <Box sx={{ mt: 2, textAlign: 'center', px: 2 }}>
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <ClaySelect
              label="AI模型"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              options={LLM_MODELS}
              width={{ xs: 120, sm: 150 }}
              showAllOption={false}
              renderOption={(option) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: option.color }} />
                  {option.label}
                </Box>
              )}
            />
            <Button
              variant="contained"
              onClick={onOCR}
              disabled={loading}
              sx={{ 
                minWidth: { xs: 100, sm: 'auto' },
                px: { xs: 3, sm: 3 },
                py: 1.5 
              }}
            >
              {loading ? '识别中...' : '开始识别'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default ImageUpload;
