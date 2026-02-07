import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { LLM_MODELS } from '../../utils/constants';

function ModelSelector({ selectedModel, onModelChange }) {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>AI模型</InputLabel>
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
  );
}

export default ModelSelector;
