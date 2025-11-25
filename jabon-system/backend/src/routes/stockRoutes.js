const express = require('express');
const router = express.Router();
const { getStockMovements } = require('../controllers/stockController');

router.get('/movimientos', getStockMovements);
router.get('/actualizaciones', getStockMovements); // alias: solo ajustes por defecto

module.exports = router;

