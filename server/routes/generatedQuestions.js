const express = require('express');
const router = express.Router();
const GeneratedQuestion = require('../models/GeneratedQuestion');

router.post('/', async (req, res) => {
  try {
    const { originalQuestionId, questionText, options, correctAnswer, explanation, targetError, practicePoint } = req.body;

    const existingQuestion = await GeneratedQuestion.findOne({
      originalQuestionId,
      questionText
    });

    if (existingQuestion) {
      return res.status(400).json({ 
        error: 'Duplicate question',
        message: '该题目已存在，请勿重复保存' 
      });
    }

    const newGeneratedQuestion = new GeneratedQuestion({
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
    res.status(500).send('Server Error');
  }
});

router.get('/original/:questionId', async (req, res) => {
  try {
    const questions = await GeneratedQuestion.find({ originalQuestionId: req.params.questionId })
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/', async (req, res) => {
  try {
    const questions = await GeneratedQuestion.find()
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id/select', async (req, res) => {
  try {
    const question = await GeneratedQuestion.findByIdAndUpdate(
      req.params.id,
      { selected: true },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ msg: 'Generated question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id/unselect', async (req, res) => {
  try {
    const question = await GeneratedQuestion.findByIdAndUpdate(
      req.params.id,
      { selected: false },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ msg: 'Generated question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const question = await GeneratedQuestion.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ msg: 'Generated question not found' });
    }

    res.json({ msg: 'Generated question removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
