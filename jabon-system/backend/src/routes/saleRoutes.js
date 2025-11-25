const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// Crear una nueva venta
router.post('/', saleController.createSale);

// Obtener todas las ventas
router.get('/', saleController.getSales);

// Obtener una venta específica por ID
router.get('/:id', saleController.getSale);

// Eliminar una venta (opcional - para testing)
router.delete('/:id', saleController.deleteSale);

module.exports = router;
