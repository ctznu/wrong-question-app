const Question = require('../models/Question');

const getStatistics = async (req, res) => {
  try {
    const questions = await Question.findAll({
      attributes: ['id', 'subject', 'questionType', 'grade', 'semester', 'createdAt']
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

    res.json({
      totalQuestions,
      questionsBySubject,
      questionsBySemester,
      questionsByTag,
      monthlyGrowth
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

const getSubjectDistribution = async (req, res) => {
  try {
    const Question = require('../models/Question');
    const questions = await Question.findAll({
      attributes: ['id', 'subject', 'questionType', 'grade', 'semester', 'createdAt']
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
    const Question = require('../models/Question');
    const questions = await Question.findAll({
      attributes: ['id', 'subject', 'questionType', 'grade', 'semester', 'createdAt']
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
    const Question = require('../models/Question');
    const questions = await Question.findAll({
      attributes: ['id', 'subject', 'questionType', 'grade', 'semester', 'createdAt']
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
    const Question = require('../models/Question');
    const questions = await Question.findAll({
      attributes: ['id', 'subject', 'questionType', 'grade', 'semester', 'createdAt']
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

module.exports = {
  getStatistics,
  getSubjectDistribution,
  getSemesterDistribution,
  getTagDistribution,
  getMonthlyTrend
};
