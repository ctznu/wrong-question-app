// server/tests/api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // 引入你的Express应用
const Question = require('../models/Question');

// 使用内存数据库进行测试
require('dotenv').config({ path: './.env.test' });

describe('Question API Tests', () => {
  beforeAll(async () => {
    // 连接到测试数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  afterAll(async () => {
    // 清理测试数据
    await Question.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 每次测试前清理数据
    await Question.deleteMany({});
  });

  test('should create a new question', async () => {
    const newQuestion = {
      subject: 'math',
      semester: '2023-秋季',
      question: '2 + 2 = ?',
      correctAnswer: '4',
      wrongAnswer: '5',
      reason: '计算错误',
      tags: ['算术']
    };

    const response = await request(app)
      .post('/api/questions')
      .send(newQuestion)
      .expect(200);

    expect(response.body.question).toBe('2 + 2 = ?');
    expect(response.body.subject).toBe('math');
    expect(response.body.correctAnswer).toBe('4');
  });

  test('should get all questions', async () => {
    // 首先创建一个问题
    await request(app)
      .post('/api/questions')
      .send({
        subject: 'math',
        semester: '2023-秋季',
        question: '3 + 3 = ?',
        correctAnswer: '6',
        wrongAnswer: '7',
        reason: '计算错误',
        tags: ['算术']
      })
      .expect(200);

    const response = await request(app)
      .get('/api/questions')
      .expect(200);

    expect(response.body.questions).toHaveLength(1);
    expect(response.body.questions[0].question).toBe('3 + 3 = ?');
  });

  test('should get a question by id', async () => {
    // 创建一个问题
    const createResponse = await request(app)
      .post('/api/questions')
      .send({
        subject: 'chinese',
        semester: '2023-秋季',
        question: '请解释"春暖花开"',
        correctAnswer: '形容春天的美好景象',
        wrongAnswer: '形容冬天',
        reason: '理解错误',
        tags: ['词语解释']
      })
      .expect(200);

    const questionId = createResponse.body._id;

    const response = await request(app)
      .get(`/api/questions/${questionId}`)
      .expect(200);

    expect(response.body.question).toBe('请解释"春暖花开"');
    expect(response.body.subject).toBe('chinese');
  });

  test('should update a question', async () => {
    // 创建一个问题
    const createResponse = await request(app)
      .post('/api/questions')
      .send({
        subject: 'english',
        semester: '2023-秋季',
        question: 'Translate: "cat"',
        correctAnswer: '猫',
        wrongAnswer: '狗',
        reason: '混淆了词汇',
        tags: ['翻译']
      })
      .expect(200);

    const questionId = createResponse.body._id;

    // 更新问题
    const updateResponse = await request(app)
      .put(`/api/questions/${questionId}`)
      .send({
        question: 'Translate: "dog"'
      })
      .expect(200);

    expect(updateResponse.body.question).toBe('Translate: "dog"');
    expect(updateResponse.body.correctAnswer).toBe('猫'); // 应保持不变
  });

  test('should delete a question', async () => {
    // 创建一个问题
    const createResponse = await request(app)
      .post('/api/questions')
      .send({
        subject: 'math',
        semester: '2023-秋季',
        question: '5 - 3 = ?',
        correctAnswer: '2',
        wrongAnswer: '3',
        reason: '计算错误',
        tags: ['减法']
      })
      .expect(200);

    const questionId = createResponse.body._id;

    // 删除问题
    await request(app)
      .delete(`/api/questions/${questionId}`)
      .expect(200);

    // 验证问题已被删除
    await request(app)
      .get(`/api/questions/${questionId}`)
      .expect(404);
  });
});