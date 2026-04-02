const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar carpeta de uploads
const uploadsDir = path.resolve(__dirname, '../../uploads/facturas');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta de uploads creada:', uploadsDir);
}

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `factura_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WEBP, PDF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const purchaseController = require('../controllers/purchaseController');

// Crear una nueva compra (con imagen)
router.post('/', upload.single('imagen'), (req, res, next) => {
  // Manejar errores de multer
  if (req.fileValidationError) {
    return res.status(400).json({ success: false, error: req.fileValidationError });
  }
  purchaseController.createPurchase(req, res);
});

// Manejar errores de multer como middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'El archivo excede el tamaño máximo permitido (10MB)' });
    }
    return res.status(400).json({ success: false, error: `Error al subir archivo: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
});

// Obtener todas las compras (con paginación y búsqueda)
router.get('/', purchaseController.getPurchases);

// Obtener una compra específica por ID
router.get('/:id', purchaseController.getPurchase);

// NO hay DELETE — las compras no pueden eliminarse

module.exports = router;
