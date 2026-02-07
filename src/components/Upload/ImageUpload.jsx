import React from 'react';
import { Box, Typography, Button, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Upload as UploadIcon } from 'lucide-react';
import { LLM_MODELS } from '../../utils/constants';

function ImageUpload({ file, preview, onFileChange, onRemove, selectedModel, onModelChange, onOCR, loading }) {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <Paper className="upload-area-container">
      <Typography variant="h6" className="upload-area-title" gutterBottom>
        上传错题照片
      </Typography>
      <Box className="upload-area">
        {preview ? (
          <Box className="preview-container">
            <img src={preview} alt="预览" className="preview-image" />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onRemove}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              移除
            </Button>
          </Box>
        ) : (
          <Box className="upload-placeholder">
            <UploadIcon size={48} color="#9e9e9e" />
            <Typography variant="body1" sx={{ mt: 2 }}>
              点击或拖拽上传图片
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </Box>
        )}
      </Box>
      {preview && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
            <FormControl>
              <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>AI模型</InputLabel>
              <Select
                value={selectedModel}
                label="AI模型"
                onChange={(e) => onModelChange(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                {LLM_MODELS.map(m => (
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
              onClick={onOCR}
              disabled={loading}
              sx={{ minWidth: 200 }}
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
