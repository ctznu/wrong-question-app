const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Question = require('../models/Question');

const JWT_SECRET = process.env.JWT_SECRET || 'mySecretKey';

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// @route   GET api/questions
// @desc    Get all questions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { subject, semester, tag, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    if (subject) filter.subject = subject;
    if (semester) filter.semester = semester;
    
    // 构建查询
    const query = Question.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // 计算总数
    const countQuery = Question.count({
      where: filter
    });
    
    // 并行执行查询
    const [questions, total] = await Promise.all([query, countQuery]);
    
    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/questions
// @desc    Add new question
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { subject, semester, question, correctAnswer, wrongAnswer, reason, tags, imageUrl } = req.body;
    
    const newQuestion = await Question.create({
      userId: req.user.id,
      subject,
      semester,
      question,
      correctAnswer,
      wrongAnswer,
      reason,
      tags,
      imageUrl
    });
    
    res.json(newQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/questions/:id
// @desc    Update question
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { subject, semester, question, correctAnswer, wrongAnswer, reason, tags, imageUrl, similarQuestions } = req.body;
    
    const questionFields = {};
    if (subject) questionFields.subject = subject;
    if (semester) questionFields.semester = semester;
    if (question) questionFields.question = question;
    if (correctAnswer) questionFields.correctAnswer = correctAnswer;
    if (wrongAnswer) questionFields.wrongAnswer = wrongAnswer;
    if (reason) questionFields.reason = reason;
    if (tags) questionFields.tags = tags;
    if (imageUrl) questionFields.imageUrl = imageUrl;
    if (similarQuestions) questionFields.similarQuestions = similarQuestions;
    questionFields.updatedAt = Date.now();
    
    // 先查找问题
    let question = await Question.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    // 更新问题
    question = await question.update(questionFields);

    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/questions/:id
// @desc    Delete question
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // 先查找问题
    const question = await Question.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // 删除问题
    await question.destroy();
    
    res.json({ msg: 'Question removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/questions/:id/generate-similar
// @desc    Generate similar questions
// @access  Private
router.post('/:id/generate-similar', auth, async (req, res) => {
  try {
    const question = await Question.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // In a real implementation, this would call an AI service to generate similar questions
    // For now, we'll simulate this with mock data
    const mockSimilarQuestions = [
      {
        question: `类似题目1: ${question.question}`,
        answer: question.correctAnswer,
        explanation: '这是根据原题生成的类似题目'
      },
      {
        question: `类似题目2: ${question.question}`,
        answer: question.correctAnswer,
        explanation: '这是根据原题生成的另一个类似题目'
      }
    ];
    
    question.similarQuestions = mockSimilarQuestions;
    await question.save();
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;