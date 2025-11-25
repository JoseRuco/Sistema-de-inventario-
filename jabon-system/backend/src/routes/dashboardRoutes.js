const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getChartData,
  getReports,
  getTopProductsByDateRange,
  getSalesByTypeThisMonth
} = require('../controllers/dashboardController');

router.get('/stats', getDashboardStats);
router.get('/charts', getChartData);
router.get('/reports', getReports);
router.get('/top-products', getTopProductsByDateRange);
router.get('/sales-by-type-month', getSalesByTypeThisMonth);


module.exports = router;
