import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const claySelectStyles = {
  borderRadius: '16px',
  bgcolor: 'rgba(240, 253, 250, 0.9)',
  boxShadow: 'inset 2px 2px 4px rgba(8, 145, 178, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
  '&:hover': {
    boxShadow: 'inset 3px 3px 6px rgba(8, 145, 178, 0.15), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
  },
  '&.Mui-focused': {
    boxShadow: 'inset 4px 4px 8px rgba(8, 145, 178, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.95)',
  },
};

export default function ClaySelect({ 
  label, 
  value, 
  onChange, 
  options, 
  icon, 
  width = '100%',
  showAllOption = true,
  allLabel = '全部',
  renderOption
}) {
  return (
    <FormControl sx={{ width }}>
      <InputLabel 
        sx={{ 
          minWidth: 'auto', 
          bgcolor: '#f0fdfa', 
          px: 0.5, 
          borderRadius: 1 
        }}
      >
        {icon}
        {label}
      </InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        sx={claySelectStyles}
      >
        {showAllOption && (
          <MenuItem value="">
            <em>{allLabel}{label}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {renderOption ? renderOption(option) : option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
