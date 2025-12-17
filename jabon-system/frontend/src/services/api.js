import axios from 'axios';

const getAPIUrl = () => {
  // 1. Permitir configuración por variable de entorno
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;

  // 2. Desarrollo (Localhost O Red Local en puerto Vite defecto 5173)
  // Si estamos en el puerto 5173, significa que es desarrollo (PC o Tablet en red local)
  // En este caso, el backend siempre está en el puerto 5000 de la misma IP
  if (port === '5173' || hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:5000/api`;
  }

  // 3. Producción (Docker/Domain)
  // Si no es el puerto de desarrollo, asumimos producción (Nginx sirviendo en puerto 80/443)
  // Usamos ruta relativa para que Nginx haga el proxy
  return '/api';
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
export const getSales = (params) => api.get('/sales', { params });
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

// ========== PEDIDOS / ENCARGOS ==========
export const getOrders = (params) => api.get('/orders', { params });
export const createOrder = (data) => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { estado: status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
// Dashboard stats for pending orders
export const getPendingOrdersCount = () => api.get('/orders/pending-count');

// CONFIGURACIÓN
export const getConfig = () => api.get('/config');
export const updateConfig = (data) => api.post('/config', data);

export default api;
