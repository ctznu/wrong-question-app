const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const GeneratedQuestion = require('../models/GeneratedQuestion');
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

router.post('/', auth, async (req, res) => {
  try {
    const { originalQuestionId, questionText, options, correctAnswer, explanation, targetError, practicePoint } = req.body;
    
    console.log('[POST /generated-questions] 用户ID:', req.user.id);
    console.log('[POST /generated-questions] 原题ID:', originalQuestionId);
    
    const originalQuestion = await Question.findById(originalQuestionId);
    
    if (!originalQuestion) {
      return res.status(404).json({ msg: '原题目不存在' });
    }
    
    if (originalQuestion.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: '无权操作此题目' });
    }
    
    const newGeneratedQuestion = new GeneratedQuestion({
      userId: req.user.id,
      originalQuestionId,
      questionText,
      options,
      correctAnswer,
      explanation,
      targetError,
      practicePoint
    });

    const savedQuestion = await newGeneratedQuestion.save();
    res.json(savedQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

router.get('/original/:questionId', auth, async (req, res) => {
  try {
    const questions = await GeneratedQuestion.find({ 
      originalQuestionId: req.params.questionId,
      userId: req.user.id
    })
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const questions = await GeneratedQuestion.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

router.put('/:id/select', auth, async (req, res) => {
  try {
    const question = await GeneratedQuestion.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ msg: 'Generated question not found' });
    }
    
    if (question.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: '无权操作此题目' });
    }

    const updatedQuestion = await GeneratedQuestion.findByIdAndUpdate(
      req.params.id,
      { selected: true },
      { new: true }
    );

    res.json(updatedQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

router.put('/:id/unselect', auth, async (req, res) => {
  try {
    const question = await GeneratedQuestion.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ msg: 'Generated question not found' });
    }
    
    if (question.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: '无权操作此题目' });
    }

    const updatedQuestion = await GeneratedQuestion.findByIdAndUpdate(
      req.params.id,
      { selected: false },
      { new: true }
    );

    res.json(updatedQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await GeneratedQuestion.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ msg: 'Generated question not found' });
    }
    
    if (question.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: '无权操作此题目' });
    }

    await GeneratedQuestion.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Generated question removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

module.exports = router;
