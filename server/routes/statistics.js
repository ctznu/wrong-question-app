const express = require('express');
const router = express.Router();

const statisticsRoutes = require('./routes/statistics');
const statisticsControllers = require('./controllers/statistics');

router.get('/statistics', statisticsControllers.getStatistics);
router.get('/statistics/subject-distribution', statisticsControllers.getSubjectDistribution);
router.get('/statistics/semester-distribution', statisticsControllers.getSemesterDistribution);
router.get('/statistics/tag-distribution', statisticsControllers.getTagDistribution);
router.get('/statistics/monthly-trend', statisticsControllers.getMonthlyTrend);

module.exports = router;
