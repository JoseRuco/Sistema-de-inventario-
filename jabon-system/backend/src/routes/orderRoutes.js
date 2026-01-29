const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.get('/pending-count', orderController.getPendingOrdersCount);

module.exports = router;
