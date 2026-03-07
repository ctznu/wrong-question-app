const Question = require('../models/Question');

const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      subject: 1, questionType: 1, grade: 1, semester: 1, createdAt: 1,
      tags: 1, difficulty: 1, errorType: 1, isWrong: 1
    });

    const totalQuestions = questions.length;

    const questionsBySubject = questions.reduce((acc, q) => {
      acc[q.subject] = (acc[q.subject] || 0) + 1;
      return acc;
    }, {});

    const questionsBySemester = questions.reduce((acc, q) => {
      acc[q.semester] = (acc[q.semester] || 0) + 1;
      return acc;
    }, {});

    const questionsByTag = questions.reduce((acc, q) => {
      if (!q.tags || q.tags.length === 0) return acc;
      
      q.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});

    const questionsByDifficulty = questions.reduce((acc, q) => {
      const difficulty = q.difficulty || 'medium';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    const questionsByErrorType = questions.reduce((acc, q) => {
      const errorType = q.errorType || 'none';
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {});

    const questionsByQuestionType = questions.reduce((acc, q) => {
      const type = q.questionType || 'short_answer';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const monthlyGrowth = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthQuestions = questions.filter(q => {
        const qDate = new Date(q.createdAt);
        return qDate.getMonth() === month.getMonth() && qDate.getFullYear() === month.getFullYear();
      });
      
      monthlyGrowth.push({
        month: month.toLocaleString('zh-CN', { month: 'long' }),
        count: monthQuestions.length
      });
    }

    const wrongQuestions = questions.filter(q => q.isWrong);
    const wrongRate = totalQuestions > 0 ? (wrongQuestions.length / totalQuestions * 100).toFixed(2) : 0;

    res.json({
      totalQuestions,
      questionsBySubject,
      questionsBySemester,
      questionsByTag,
      questionsByDifficulty,
      questionsByErrorType,
      questionsByQuestionType,
      monthlyGrowth,
      wrongRate
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

const getSubjectDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      subject: 1, questionType: 1, grade: 1, semester: 1, createdAt: 1
    });

    const distribution = questions.reduce((acc, q) => {
      acc[q.subject] = (acc[q.subject] || 0) + 1;
      return acc;
    }, {});

    res.json({
      distribution
    });
  } catch (error) {
    console.error('获取学科分布失败:', error);
    res.status(500).json({ error: '获取学科分布失败' });
  }
};

const getSemesterDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      subject: 1, questionType: 1, grade: 1, semester: 1, createdAt: 1
    });

    const distribution = questions.reduce((acc, q) => {
      acc[q.semester] = (acc[q.semester] || 0) + 1;
      return acc;
    }, {});

    res.json({
      distribution
    });
  } catch (error) {
    console.error('获取学期分布失败:', error);
    res.status(500).json({ error: '获取学期分布失败' });
  }
};

const getTagDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      subject: 1, questionType: 1, grade: 1, semester: 1, createdAt: 1, tags: 1
    });

    const distribution = {};
    questions.forEach(q => {
      if (q.tags && q.tags.length > 0) {
        q.tags.forEach(tag => {
          distribution[tag] = (distribution[tag] || 0) + 1;
        });
      }
    });

    res.json({
      distribution
    });
  } catch (error) {
    console.error('获取标签分布失败:', error);
    res.status(500).json({ error: '获取标签分布失败' });
  }
};

const getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      subject: 1, questionType: 1, grade: 1, semester: 1, createdAt: 1
    });

    const monthlyTrend = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthQuestions = questions.filter(q => {
        const qDate = new Date(q.createdAt);
        return qDate.getMonth() === month.getMonth() && qDate.getFullYear() === month.getFullYear();
      });
      
      monthlyTrend.push({
        month: month.toLocaleString('zh-CN', { month: 'long' }),
        count: monthQuestions.length
      });
    }

    res.json({
      monthlyTrend
    });
  } catch (error) {
    console.error('获取月度趋势失败:', error);
    res.status(500).json({ error: '获取月度趋势失败' });
  }
};

const getDifficultyDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      difficulty: 1
    });

    const distribution = questions.reduce((acc, q) => {
      const difficulty = q.difficulty || 'medium';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    res.json({
      distribution
    });
  } catch (error) {
    console.error('获取难度分布失败:', error);
    res.status(500).json({ error: '获取难度分布失败' });
  }
};

const getErrorTypeDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      isWrong: 1, errorType: 1
    });

    const distribution = {};
    questions.forEach(q => {
      const errorType = q.errorType || 'none';
      distribution[errorType] = (distribution[errorType] || 0) + 1;
    });

    res.json({
      distribution
    });
  } catch (error) {
    console.error('获取错误类型分布失败:', error);
    res.status(500).json({ error: '获取错误类型分布失败' });
  }
};

const getQuestionTypeDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await Question.find({ userId }, {
      questionType: 1
    });

    const distribution = questions.reduce((acc, q) => {
      const type = q.questionType || 'short_answer';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      distribution
    });
  } catch (error) {
    console.error('获取题目类型分布失败:', error);
    res.status(500).json({ error: '获取题目类型分布失败' });
  }
};

module.exports = {
  getStatistics,
  getSubjectDistribution,
  getSemesterDistribution,
  getTagDistribution,
  getMonthlyTrend,
  getDifficultyDistribution,
  getErrorTypeDistribution,
  getQuestionTypeDistribution
};
