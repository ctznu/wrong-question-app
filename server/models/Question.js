const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['chinese', 'math', 'english', 'unknown']
  },
  semester: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  wrongAnswer: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  similarQuestions: [{
    question: String,
    answer: String,
    explanation: String
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },

  // ========== 新增：智能识别相关字段 ==========

  // 题目类型（单选、多选、填空、简答等）
  questionType: {
    type: String,
    enum: ['single_choice', 'multiple_choice', 'fill_blank', 'short_answer', 'essay'],
    default: 'short_answer'
  },

  // 选项列表（用于选择题）
  options: [{
    key: { type: String },        // 选项标识: A, B, C, D
    text: { type: String }       // 选项内容
  }],

  // 学生答案
  studentAnswer: {
    type: String,
    default: ''
  },

  // 学生答案在图片中的位置（用于前端高亮标注）
  studentAnswerBbox: {
    x: { type: Number, default: 0 },      // 左上角 X（百分比，0-1）
    y: { type: Number, default: 0 },      // 左上角 Y（百分比，0-1）
    width: { type: Number, default: 0 },  // 宽度（百分比）
    height: { type: Number, default: 0 }  // 高度（百分比）
  },

  // 学生答案是否错误
  isWrong: {
    type: Boolean,
    default: false
  },

  // 错误类型（预设类别）
  errorType: {
    type: String,
    enum: ['calculation', 'concept', 'reading', 'careless', 'none'],
    default: 'none'
  },

  // 错误原因详细分析
  errorReason: {
    type: String,
    default: ''
  },

  // 题目详细解析
  explanation: {
    type: String,
    default: ''
  },

  // OCR 识别的原始文本
  ocrRawText: {
    type: String,
    default: ''
  },

  // OCR 识别的词块信息（用于前端可视化）
  ocrWords: [{
    text: String,
    left: Number,
    top: Number,
    width: Number,
    height: Number,
    confidence: Number
  }],

  // LLM 识别源
  llmSource: {
    type: String,
    enum: ['ollama', 'api', 'none', 'rule_based'],
    default: 'none'
  },

  // LLM 分析的置信度
  llmConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },

  // 识别时间戳
  analyzedAt: {
    type: Date,
    default: Date.now
  },

  // ========== 现有字段 ==========
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);