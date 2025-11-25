const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');

router.get('/debts', creditController.getPendingDebts);
router.get('/debts/client/:clientId', creditController.getClientDebt);
router.post('/payment', creditController.registerPayment);
router.get('/payment-history/:ventaId', creditController.getPaymentHistory);
router.get('/summary', creditController.getPortfolioSummary);

module.exports = router;
