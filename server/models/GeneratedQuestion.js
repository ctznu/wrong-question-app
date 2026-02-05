const mongoose = require('mongoose');

const generatedQuestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalQuestionId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    key: { type: String },
    text: { type: String }
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  },
  targetError: {
    type: String,
    default: ''
  },
  practicePoint: {
    type: String,
    default: ''
  },
  selected: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GeneratedQuestion', generatedQuestionSchema);
