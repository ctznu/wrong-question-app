import React from 'react';
import { Box, Typography } from '@mui/material';
import { LLM_MODELS } from '../../utils/constants';
import ClaySelect from '../ClaySelect';

function ModelSelector({ selectedModel, onModelChange }) {
  return (
    <Box sx={{ mb: 2 }}>
      <ClaySelect
        label="AI模型"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        options={LLM_MODELS}
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
