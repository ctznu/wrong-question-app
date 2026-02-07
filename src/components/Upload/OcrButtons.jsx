import React from 'react';
import { Button, Box, CircularProgress, Stack, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { Scan } from 'lucide-react';
import { LLM_MODELS } from '../../utils/constants';

function OcrButtons({ loading, loadingType, selectedModel, onModelChange, onZhipuOCR, onTongyiOCR, onHunyuanOCR, onOllamaOCR }) {
  return (
    <Box sx={{ mt: 2, textAlign: 'center' }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>选择AI模型</InputLabel>
        <Select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          label="选择AI模型"
        >
          {LLM_MODELS.map(model => (
            <MenuItem key={model.value} value={model.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: model.color
                  }}
                />
                <Typography variant="body2">{model.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        点击下方按钮开始识别
      </Typography>
      
      <Stack direction="row" spacing={2} justifyContent="center">
        {LLM_MODELS.map(model => (
          <Button
            key={model.value}
            variant="contained"
            onClick={() => {
              if (model.value === 'zhipu') onZhipuOCR();
              else if (model.value === 'tongyi') onTongyiOCR();
              else if (model.value === 'hunyuan') onHunyuanOCR();
              else if (model.value === 'ollama') onOllamaOCR();
            }}
            disabled={loading}
            sx={{
              backgroundColor: model.color,
              '&:hover': {
                backgroundColor: model.color,
                opacity: 0.8
              },
              '&:disabled': {
                backgroundColor: model.color,
                opacity: 0.5
              }
            }}
          >
            {loading && loadingType === model.value ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <>
                <Scan size={20} style={{ marginRight: 8 }} />
                {model.label}
              </>
            )}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

export default OcrButtons;
