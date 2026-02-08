const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Question = require('./Question');

const GeneratedQuestion = sequelize.define('GeneratedQuestion', {
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
  originalQuestionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  explanation: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  targetError: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  practicePoint: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  selected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'generated_questions'
});

// 定义关联关系
GeneratedQuestion.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(GeneratedQuestion, { foreignKey: 'userId' });

module.exports = GeneratedQuestion;
