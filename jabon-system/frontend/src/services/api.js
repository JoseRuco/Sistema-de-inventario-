import axios from 'axios';

// Detecta automáticamente si estás en red local o localhost
const getAPIUrl = () => {
  const hostname = window.location.hostname;

  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

const API_URL = getAPIUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// PRODUCTOS
export const getProducts = () => api.get('/productos');
export const getProduct = (id) => api.get(`/productos/${id}`);
export const getProductStats = (id) => api.get(`/productos/${id}/stats`);
export const createProduct = (data) => api.post('/productos', data);
export const updateProduct = (id, data) => api.put(`/productos/${id}`, data);
export const deleteProduct = (id) => api.delete(`/productos/${id}`);

// CLIENTES
export const getClients = () => api.get('/clientes');
export const getClient = (id) => api.get(`/clientes/${id}`);
export const getClientHistory = (id) => api.get(`/clientes/${id}/history`);  // ✅ 
export const createClient = (data) => api.post('/clientes', data);
export const updateClient = (id, data) => api.put(`/clientes/${id}`, data);
export const deleteClient = (id) => api.delete(`/clientes/${id}`);

// VENTAS - ✅ CORREGIDO
export const getSales = () => api.get('/sales');
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post('/sales', data);
export const searchSales = (params) => api.get('/sales/search', { params });

// DASHBOARD
export const getSalesByTypeMonth = () => api.get('/dashboard/sales-by-type-month');
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getChartData = () => api.get('/dashboard/charts');
export const getReports = (params) => api.get('/dashboard/reports', { params });
export const getTopProducts = (params) => api.get('/dashboard/top-products', { params });

// Solo actualizaciones manuales de stock (alias a /stock/actualizaciones)
export const getManualStockUpdates = (params) =>
  api.get('/stock/actualizaciones', { params });


// STOCK - HISTORIAL
export const getStockMovements = (params) => api.get('/stock/movimientos', { params });

// ========== CRÉDITOS / CUENTAS POR COBRAR ==========

// Obtener todas las deudas pendientes
export const getPendingDebts = () => api.get('/credits/debts');

// Obtener deuda de un cliente específico
export const getClientDebt = (clientId) => api.get(`/credits/debts/client/${clientId}`);

// Registrar un abono
export const registerPayment = (paymentData) => api.post('/credits/payment', paymentData);

// Obtener historial de abonos de una venta
export const getPaymentHistory = (ventaId) => api.get(`/credits/payment-history/${ventaId}`);

// Obtener resumen de cartera
export const getPortfolioSummary = () => api.get('/credits/summary');

// ========== ANALYTICS / ANÁLISIS DE NEGOCIO ==========

// Obtener mejores clientes
export const getTopCustomers = (params) => api.get('/analytics/top-customers', { params });

// Obtener productos de baja rotación
export const getLowRotationProducts = (params) => api.get('/analytics/low-rotation', { params });

// Obtener predicción de ventas
export const getSalesPrediction = () => api.get('/analytics/sales-prediction');

// Obtener margen de ganancia por categoría
export const getProfitMarginByCategory = (params) => api.get('/analytics/profit-margin', { params });

// CONFIGURACIÓN
export const getConfig = () => api.get('/config');
export const updateConfig = (data) => api.post('/config', data);

export default api;
