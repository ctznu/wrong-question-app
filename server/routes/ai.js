const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Mock AI题目生成函数 - 实际部署时应替换为真正的AI服务
function generateSimilarQuestions(originalQuestion, count = 3) {
  const questions = [];
  
  // 根据原始问题生成类似的题目
  for (let i = 0; i < count; i++) {
    let similarQuestion = '';
    let answer = '';
    let explanation = '';
    
    // 根据题目类型生成相似题目
    if (originalQuestion.question.includes('x +') || originalQuestion.question.includes('求x')) {
      // 数学题：解方程
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + num1;
      similarQuestion = `已知 x + ${num1} = ${num2}，求 x 的值。`;
      answer = (num2 - num1).toString();
      explanation = `将等式两边同时减去${num1}，得到 x = ${num2} - ${num1} = ${answer}`;
    } else if (originalQuestion.question.includes('面积') || originalQuestion.question.includes('长方形')) {
      // 几何题：面积计算
      const length = Math.floor(Math.random() * 10) + 1;
      const width = Math.floor(Math.random() * 8) + 1;
      similarQuestion = `一个长方形的长是${length}厘米，宽是${width}厘米，它的面积是多少平方厘米？`;
      answer = (length * width).toString();
      explanation = `长方形面积 = 长 × 宽 = ${length} × ${width} = ${answer} 平方厘米`;
    } else if (originalQuestion.question.includes('加法') || originalQuestion.question.includes('+')) {
      // 加法题
      const num1 = Math.floor(Math.random() * 50) + 1;
      const num2 = Math.floor(Math.random() * 50) + 1;
      similarQuestion = `计算：${num1} + ${num2} = ?`;
      answer = (num1 + num2).toString();
      explanation = `个位相加：${num1 % 10} + ${num2 % 10} = ${(num1 % 10) + (num2 % 10)}，十位相加：${Math.floor(num1 / 10)} + ${Math.floor(num2 / 10)} = ${Math.floor(num1 / 10) + Math.floor(num2 / 10)}，最终结果为 ${answer}`;
    } else {
      // 默认情况：变化数字或关键词
      similarQuestion = originalQuestion.question.replace(/\d+/g, (match) => {
        const num = parseInt(match);
        if (!isNaN(num)) {
          return (num + Math.floor(Math.random() * 5) + 1).toString();
        }
        return match;
      });
      answer = originalQuestion.correctAnswer;
      explanation = `这是根据原题变化数值后的新题目，解题思路与原题相同。`;
    }
    
    questions.push({
      question: similarQuestion,
      answer: answer,
      explanation: explanation
    });
  }
  
  return questions;
}

// @route   POST api/questions/:id/generate-similar
// @desc    Generate similar questions using AI
// @access  Public
router.post('/:id/generate-similar', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // 使用AI生成类似题目
    const similarQuestions = generateSimilarQuestions(question, 5);
    
    // 更新问题文档
    question.similarQuestions = similarQuestions;
    question.updatedAt = Date.now();
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

// @route   POST api/ai/generate-question
// @desc    Generate a new question based on topic and difficulty
// @access  Public
router.post('/generate-question', async (req, res) => {
  try {
    const { subject, topic, difficulty } = req.body;
    
    // 根据主题和难度生成题目
    let question = '';
    let answer = '';
    let explanation = '';
    
    if (subject === 'math') {
      if (topic === 'algebra' || question.includes('x') || question.includes('求')) {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 20) + a;
        question = `解方程：x + ${a} = ${b}`;
        answer = (b - a).toString();
        explanation = `将等式两边同时减去${a}，得到 x = ${b} - ${a} = ${answer}`;
      } else if (topic === 'geometry' || topic === 'area') {
        const length = Math.floor(Math.random() * 15) + 5;
        const width = Math.floor(Math.random() * 10) + 3;
        question = `一个长方形的长是${length}厘米，宽是${width}厘米，它的面积是多少平方厘米？`;
        answer = (length * width).toString();
        explanation = `长方形面积公式：面积 = 长 × 宽 = ${length} × ${width} = ${answer} 平方厘米`;
      } else {
        // 默认算术题
        const num1 = Math.floor(Math.random() * 50) + 10;
        const num2 = Math.floor(Math.random() * num1) + 5;
        question = `计算：${num1} - ${num2} = ?`;
        answer = (num1 - num2).toString();
        explanation = `从${num1}中减去${num2}，得到 ${num1 - num2}`;
      }
    } else if (subject === 'chinese') {
      // 语文题目
      const chineseQuestions = [
        { q: "请写出“春暖花开”这个成语的意思。", a: "形容春天气候温暖，百花盛开。比喻美好季节的到来，也比喻大好形势的到来。", exp: "春暖花开是一个描写春天景象的成语，常用来比喻美好时光的到来。" },
        { q: "“书山有路勤为径”的下一句是什么？", a: "学海无涯苦作舟", exp: "这句话出自古训，意思是：学习的道路上没有捷径，只有勤奋努力才能到达成功的彼岸。" },
        { q: "请解释“专心致志”的意思。", a: "把心思全放在上面。形容一心一意，聚精会神。", exp: "专心致志是一个褒义词，形容注意力高度集中。" }
      ];
      const randomQ = chineseQuestions[Math.floor(Math.random() * chineseQuestions.length)];
      question = randomQ.q;
      answer = randomQ.a;
      explanation = randomQ.exp;
    } else if (subject === 'english') {
      // 英语题目
      const englishQuestions = [
        { q: "How do you spell the word for '猫' in English?", a: "cat", exp: "Cat is a common pet animal, spelled C-A-T." },
        { q: "What is the past tense of 'go'?", a: "went", exp: "Go is an irregular verb, its past tense is went." },
        { q: "Translate '红色' to English.", a: "red", exp: "Red is a primary color, corresponding to '红色' in Chinese." }
      ];
      const randomQ = englishQuestions[Math.floor(Math.random() * englishQuestions.length)];
      question = randomQ.q;
      answer = randomQ.a;
      explanation = randomQ.exp;
    } else {
      // 默认情况
      question = `根据${subject}的${topic || '基本'}知识，回答以下问题：这是一道自动生成的练习题。`;
      answer = "这是一道示例答案";
      explanation = "这是对题目的解释说明";
    }
    
    res.json({
      question,
      answer,
      explanation,
      subject,
      topic,
      difficulty: difficulty || 'medium'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;