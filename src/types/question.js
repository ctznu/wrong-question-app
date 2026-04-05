/**
 * 题目类型定义
 */
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  FILL_BLANK: 'fill_blank',
  SHORT_ANSWER: 'short_answer',
  CALCULATION: 'calculation',
  UNKNOWN: 'unknown'
};

export const QUESTION_TYPE_LABELS = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  fill_blank: '填空题',
  short_answer: '简答题',
  calculation: '计算题',
  unknown: '未知'
};

/**
 * 错误类型定义
 */
export const ERROR_TYPES = {
  CALCULATION: 'calculation',
  CONCEPT: 'concept',
  READING: 'reading',
  CARELESS: 'careless',
  UNKNOWN: 'unknown'
};

export const ERROR_TYPE_LABELS = {
  calculation: '计算错误',
  concept: '概念不清',
  reading: '审题错误',
  careless: '粗心大意',
  unknown: '未知'
};

/**
 * 学科定义
 */
export const SUBJECTS = {
  CHINESE: 'chinese',
  MATH: 'math',
  ENGLISH: 'english'
};

export const SUBJECT_LABELS = {
  chinese: '语文',
  math: '数学',
  english: '英语'
};

/**
 * 学期定义
 */
export const SEMESTER_TYPES = {
  FIRST: '1',
  SECOND: '2'
};

export const SEMESTER_LABELS = {
  '1': '上',
  '2': '下'
};

/**
 * 年级定义
 */
export const GRADES = {
  GRADE_1: '1',
  GRADE_2: '2',
  GRADE_3: '3',
  GRADE_4: '4',
  GRADE_5: '5',
  GRADE_6: '6'
};

export const GRADE_LABELS = {
  '1': '一年级',
  '2': '二年级',
  '3': '三年级',
  '4': '四年级',
  '5': '五年级',
  '6': '六年级'
};

/**
 * AI 模型定义
 */
export const LLM_MODELS = {
  ZHIPU: 'zhipu',
  TONGYI: 'tongyi',
  HUNYUAN: 'hunyuan',
  VOLCENGINE: 'volcengine',
  OLLAMA: 'ollama'
};

export const LLM_MODEL_LABELS = {
  zhipu: '智谱AI',
  tongyi: '通义千问',
  hunyuan: '腾讯混元',
  volcengine: '火山引擎',
  ollama: '本地Ollama'
};
