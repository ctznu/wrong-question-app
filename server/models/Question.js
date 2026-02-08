const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.ENUM('chinese', 'math', 'english', 'unknown'),
    allowNull: false
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wrongAnswer: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  reason: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  imageUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  similarQuestions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  questionType: {
    type: DataTypes.ENUM('single_choice', 'multiple_choice', 'fill_blank', 'short_answer', 'essay'),
    defaultValue: 'short_answer'
  },
  options: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  studentAnswer: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  studentAnswerBbox: {
    type: DataTypes.JSONB,
    defaultValue: {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
  },
  isWrong: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  errorType: {
    type: DataTypes.ENUM('calculation', 'concept', 'reading', 'careless', 'none'),
    defaultValue: 'none'
  },
  errorReason: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  explanation: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  ocrRawText: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  ocrWords: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  llmSource: {
    type: DataTypes.ENUM('ollama', 'api', 'none', 'rule_based'),
    defaultValue: 'none'
  },
  llmConfidence: {
    type: DataTypes.FLOAT,
    min: 0,
    max: 1,
    defaultValue: 0.5
  },
  analyzedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'questions'
});

// 定义关联关系
Question.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Question, { foreignKey: 'userId' });

module.exports = Question;
