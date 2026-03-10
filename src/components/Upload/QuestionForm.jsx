import React from 'react';
import { TextField, Box, Typography, Stack, InputAdornment, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { SUBJECTS } from '../../utils/constants';
import { getSemesterOptions, getGradeLabel } from '../../utils/formatters';
import { X } from 'lucide-react';
import ClaySelect from '../ClaySelect';
import FlexibleTextarea from '../FlexibleTextarea';

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
    <Box sx={{ px: { xs: 1, sm: 0 } }}>
      {/* 学科和学期 - 响应式布局 */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 2, 
          mb: 2, 
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }}
      >
        <ClaySelect
          label="学科 *"
          value={formData.subject}
          onChange={handleFieldChange('subject')}
          options={SUBJECTS}
          width={140}
          showAllOption={false}
        />
        <ClaySelect
          label="学期"
          value={formData.semester}
          onChange={handleFieldChange('semester')}
          options={semesters.map(s => {
            const [grade, semesterType] = s.split('-');
            return { value: s, label: `${getGradeLabel(grade)}-${semesterType}` };
          })}
          width={180}
          showAllOption={false}
        />
      </Box>

      {/* 题目内容单独占一行 */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="题目内容 *"
          multiline
          rows={{ xs: 4, sm: 3 }}
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

      {/* 正确答案和解析 - 响应式布局 */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          mb: 3
        }}
      >
        <TextField
          sx={{ flex: 1 }}
          label="正确答案 *"
          multiline
          rows={{ xs: 3, sm: 3 }}
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
          onBlur={() => setFocusedField('correctAnswer')}
        />
        <FlexibleTextarea
          label="解析"
          value={formData.explanation || ''}
          onChange={handleFieldChange('explanation')}
          placeholder="请输入题目解析（包含推理步骤）..."
          flex={3}
          clearable={true}
          onClear={() => onChange('explanation', '')}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
      </Box>

      {/* 错误答案和错误原因 - 响应式布局 */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          mb: 3
        }}
      >
        <TextField
          sx={{ flex: 1 }}
          label="错误答案"
          multiline
          rows={2}
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
          onBlur={() => setFocusedField('wrongAnswer')}
        />
        <FlexibleTextarea
          label="错误原因"
          value={formData.reason}
          onChange={handleFieldChange('reason')}
          placeholder="请输入错误原因分析..."
          flex={3}
          clearable={true}
          onClear={() => onChange('reason', '')}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
      </Box>

      {/* 标签单独占一行，支持多选 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          错误类型
        </Typography>
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('计算错误')} onChange={(e) => handleTagChange('计算错误', e.target.checked)} />}
            label="计算错误"
            sx={{ marginRight: 0 }}
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('概念不清')} onChange={(e) => handleTagChange('概念不清', e.target.checked)} />}
            label="概念不清"
            sx={{ marginRight: 0 }}
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('审题错误')} onChange={(e) => handleTagChange('审题错误', e.target.checked)} />}
            label="审题错误"
            sx={{ marginRight: 0 }}
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('粗心大意')} onChange={(e) => handleTagChange('粗心大意', e.target.checked)} />}
            label="粗心大意"
            sx={{ marginRight: 0 }}
          />
          <FormControlLabel
            control={<Checkbox checked={formData.tags.includes('其他')} onChange={(e) => handleTagChange('其他', e.target.checked)} />}
            label="其他"
            sx={{ marginRight: 0 }}
          />
        </Stack>
      </Box>
    </Box>
  );
}

export default QuestionForm;
