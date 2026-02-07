import React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography, Stack, InputAdornment, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { SUBJECTS } from '../../utils/constants';
import { getSemesterOptions } from '../../utils/formatters';
import { X } from 'lucide-react';

function QuestionForm({ formData, onChange, user }) {
  const [focusedField, setFocusedField] = React.useState('');

  const handleFieldChange = (field) => (e) => {
    onChange(field, e.target.value);
  };

  const handleTagChange = (tag, checked) => {
    if (checked) {
      onChange('tags', [...formData.tags, tag]);
    } else {
      onChange('tags', formData.tags.filter(t => t !== tag));
    }
  };

  const semesters = getSemesterOptions(user?.currentGrade);

  return (
    <>
      {/* 学科和学期一起占一行 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
        <FormControl>
          <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>学科 *</InputLabel>
          <Select
            value={formData.subject}
            label="学科 *"
            onChange={handleFieldChange('subject')}
            sx={{ minWidth: 200 }}
          >
            {SUBJECTS.map(s => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel sx={{ bgcolor: 'white', px: 0.5 }}>学期</InputLabel>
          <Select
            value={formData.semester}
            label="学期"
            onChange={handleFieldChange('semester')}
            sx={{ minWidth: 200 }}
          >
            {semesters.map(s => {
              const [grade, semesterType] = s.split('-');
              return (
                <MenuItem key={s} value={s}>{grade}年级-{semesterType}</MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {/* 题目内容单独占一行 */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="题目内容 *"
          multiline
          rows={3}
          value={formData.question}
          onChange={handleFieldChange('question')}
          placeholder="请输入题目内容..."
          InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
          InputProps={{
            endAdornment: formData.question && (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => onChange('question', '')} 
                  edge="end"
                  sx={{ 
                    opacity: focusedField === 'question' ? 1 : 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onMouseEnter={() => setFocusedField('question')}
                  onMouseLeave={() => setFocusedField('')}
                >
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            )
          }}
          onFocus={() => setFocusedField('question')}
          onBlur={() => setFocusedField('')}
        />
      </Box>

      {/* 正确答案和错误答案放在一行，各占50% */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="正确答案 *"
          value={formData.correctAnswer}
          onChange={handleFieldChange('correctAnswer')}
          placeholder="请输入正确答案..."
          InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
          InputProps={{
            endAdornment: formData.correctAnswer && (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => onChange('correctAnswer', '')} 
                  edge="end"
                  sx={{ 
                    opacity: focusedField === 'correctAnswer' ? 1 : 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onMouseEnter={() => setFocusedField('correctAnswer')}
                  onMouseLeave={() => setFocusedField('')}
                >
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            )
          }}
          onFocus={() => setFocusedField('correctAnswer')}
          onBlur={() => setFocusedField('')}
        />
        <TextField
          fullWidth
          label="错误答案"
          value={formData.wrongAnswer}
          onChange={handleFieldChange('wrongAnswer')}
          placeholder="请输入学生的错误答案..."
          InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
          InputProps={{
            endAdornment: formData.wrongAnswer && (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => onChange('wrongAnswer', '')} 
                  edge="end"
                  sx={{ 
                    opacity: focusedField === 'wrongAnswer' ? 1 : 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onMouseEnter={() => setFocusedField('wrongAnswer')}
                  onMouseLeave={() => setFocusedField('')}
                >
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            )
          }}
          onFocus={() => setFocusedField('wrongAnswer')}
          onBlur={() => setFocusedField('')}
        />
      </Box>

      {/* 错误原因单独占一行 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="错误原因"
          multiline
          rows={4}
          value={formData.reason}
          onChange={handleFieldChange('reason')}
          placeholder="请输入错误原因分析..."
          InputLabelProps={{ sx: { bgcolor: 'white', px: 0.5 } }}
          InputProps={{
            endAdornment: formData.reason && (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => onChange('reason', '')} 
                  edge="end"
                  sx={{ 
                    opacity: focusedField === 'reason' ? 1 : 0,
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  onMouseEnter={() => setFocusedField('reason')}
                  onMouseLeave={() => setFocusedField('')}
                >
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            )
          }}
          onFocus={() => setFocusedField('reason')}
          onBlur={() => setFocusedField('')}
        />
      </Box>

      {/* 标签单独占一行，支持多选 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          错误类型
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('计算错误')} onChange={(e) => handleTagChange('计算错误', e.target.checked)} />}
            label="计算错误"
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('概念不清')} onChange={(e) => handleTagChange('概念不清', e.target.checked)} />}
            label="概念不清"
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('审题错误')} onChange={(e) => handleTagChange('审题错误', e.target.checked)} />}
            label="审题错误"
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('粗心大意')} onChange={(e) => handleTagChange('粗心大意', e.target.checked)} />}
            label="粗心大意"
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('其他')} onChange={(e) => handleTagChange('其他', e.target.checked)} />}
            label="其他"
          />
        </Stack>
      </Box>
    </>
  );
}

export default QuestionForm;
