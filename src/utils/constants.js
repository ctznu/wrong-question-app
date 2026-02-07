/**
 * 学科配置
 */
export const SUBJECTS = [
  { value: 'chinese', label: '语文', color: 'chinese-chip' },
  { value: 'math', label: '数学', color: 'math-chip' },
  { value: 'english', label: '英语', color: 'english-chip' }
];

/**
 * 年级配置
 */
export const GRADES = [
  { value: '1', label: '一年级' },
  { value: '2', label: '二年级' },
  { value: '3', label: '三年级' },
  { value: '4', label: '四年级' },
  { value: '5', label: '五年级' },
  { value: '6', label: '六年级' }
];

/**
 * 学期配置
 */
export const SEMESTERS = [
  { value: '1', label: '上' },
  { value: '2', label: '下' }
];

/**
 * 题目类型配置
 */
export const QUESTION_TYPES = [
  { value: 'single_choice', label: '单选题' },
  { value: 'multiple_choice', label: '多选题' },
  { value: 'fill_blank', label: '填空题' },
  { value: 'short_answer', label: '简答题' },
  { value: 'calculation', label: '计算题' },
  { value: 'unknown', label: '未知' }
];

/**
 * 错误类型配置
 */
export const ERROR_TYPES = [
  { value: 'calculation', label: '计算错误' },
  { value: 'concept', label: '概念不清' },
  { value: 'reading', label: '审题错误' },
  { value: 'careless', label: '粗心大意' },
  { value: 'unknown', label: '未知' }
];

/**
 * AI 模型配置
 */
export const LLM_MODELS = [
  { value: 'zhipu', label: '智谱AI', color: '#4D6BFE' },
  { value: 'tongyi', label: '通义千问', color: '#FF6B6B' },
  { value: 'hunyuan', label: '腾讯混元', color: '#0052D9' },
  { value: 'ollama', label: '本地Ollama', color: '#10B981' }
];
