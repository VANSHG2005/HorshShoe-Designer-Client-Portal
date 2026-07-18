const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardCharts,
} = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);

module.exports = router;
