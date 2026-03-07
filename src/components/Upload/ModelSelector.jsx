import React from 'react';
import { Box, Typography } from '@mui/material';
import { LLM_MODELS } from '../../utils/constants';
import ClaySelect from '../ClaySelect';
import { useAuth } from '../../contexts/AuthContext';

function ModelSelector({ selectedModel, onModelChange }) {
  const { user } = useAuth();
  
  // 获取用户被允许使用的模型
  const allowedModels = user?.allowedModels || ['zhipu'];
  const filteredModels = LLM_MODELS.filter(model => allowedModels.includes(model.value));

  return (
    <Box sx={{ mb: 2 }}>
      <ClaySelect
        label="AI模型"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        options={filteredModels}
        width="100%"
        showAllOption={false}
        renderOption={(option) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: option.color
              }}
            />
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        )}
      />
    </Box>
  );
}

export default ModelSelector;
