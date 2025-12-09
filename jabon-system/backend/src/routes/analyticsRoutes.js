const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Rutas de Analytics
router.get('/top-customers', analyticsController.getTopCustomers);
router.get('/low-rotation', analyticsController.getLowRotationProducts);
router.get('/sales-prediction', analyticsController.getSalesPrediction);
router.get('/profit-margin', analyticsController.getProfitMarginByCategory);

module.exports = router;
