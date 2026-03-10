import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { X } from 'lucide-react';

function FlexibleTextarea({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  flex = 3,
  clearable = false,
  onClear,
  focusedField,
  setFocusedField
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <TextField
      sx={{ 
        flex,
        '& .MuiInputBase-root': {
          alignItems: 'flex-start'
        },
        '& .MuiInputBase-inputMultiline': {
          minHeight: '46px !important',
          maxHeight: '144px',
          overflowY: 'auto !important'
        }
      }}
      label={label}
      multiline
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
      InputProps={{
        endAdornment: clearable && value && (
          <InputAdornment position="end">
            <IconButton 
              onClick={handleClear}
              edge="end"
              sx={{ 
                opacity: focusedField === label ? 1 : 0,
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
              onMouseEnter={() => setFocusedField && setFocusedField(label)}
              onMouseLeave={() => setFocusedField && setFocusedField('')}
            >
              <X size={16} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      onFocus={() => setFocusedField && setFocusedField(label)}
      onBlur={() => setFocusedField && setFocusedField(label)}
    />
  );
}

export default FlexibleTextarea;
