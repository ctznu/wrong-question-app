const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const statisticsControllers = require('../controllers/statistics');

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

router.get('/', auth, statisticsControllers.getStatistics);
router.get('/subject-distribution', auth, statisticsControllers.getSubjectDistribution);
router.get('/semester-distribution', auth, statisticsControllers.getSemesterDistribution);
router.get('/tag-distribution', auth, statisticsControllers.getTagDistribution);
router.get('/monthly-trend', auth, statisticsControllers.getMonthlyTrend);
router.get('/difficulty-distribution', auth, statisticsControllers.getDifficultyDistribution);
router.get('/error-type-distribution', auth, statisticsControllers.getErrorTypeDistribution);
router.get('/question-type-distribution', auth, statisticsControllers.getQuestionTypeDistribution);

module.exports = router;
