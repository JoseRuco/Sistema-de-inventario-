import { useState, useEffect } from 'react';
import {
  Users, Package, TrendingUp, DollarSign, Calendar, ChevronDown, ChevronUp,
  AlertCircle, RefreshCw, Award, Phone, Clock, Target, Activity, BarChart3
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getTopCustomers,
  getLowRotationProducts,
  getSalesPrediction,
  getProfitMarginByCategory
} from '../../services/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos de cada sección
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowRotation, setLowRotation] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [profitMargin, setProfitMargin] = useState([]);
  const [profitTotals, setProfitTotals] = useState(null);

  // Filtros
  const [rotationDays, setRotationDays] = useState(60);
  const [marginDateRange, setMarginDateRange] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });

  // Secciones expandidas/colapsadas
  const [expandedSections, setExpandedSections] = useState({
    customers: true,
    rotation: true,
    prediction: true,
    margin: true
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [customersRes, rotationRes, marginRes] = await Promise.all([
        getTopCustomers({ limit: 10 }),
        getLowRotationProducts({ days: rotationDays }),
        // getSalesPrediction(), // DESHABILITADO TEMPORALMENTE
        getProfitMarginByCategory(marginDateRange)
      ]);

      setTopCustomers(customersRes.data.data || []);
      setLowRotation(rotationRes.data.data || []);
      // setPrediction(predictionRes.data.data || null); // DESHABILITADO TEMPORALMENTE
      setProfitMargin(marginRes.data.data || []);
      setProfitTotals(marginRes.data.totals || null);

    } catch (err) {
      console.error('Error cargando datos de analytics:', err);
      setError('Error al cargar los datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar solo datos de margen con filtros
  const loadProfitMarginData = async () => {
    try {
      const marginRes = await getProfitMarginByCategory(marginDateRange);
      setProfitMargin(marginRes.data.data || []);
      setProfitTotals(marginRes.data.totals || null);
    } catch (err) {
      console.error('Error cargando margen de ganancia:', err);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando Análisis de Negocio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-red-600 font-bold text-xl mb-3 text-center">Error</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <button
            onClick={loadAllData}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-medium shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={18} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <TrendingUp className="text-blue-600" size={28} />
                </div>
                Análisis de Negocio
              </h1>
              <p className="text-gray-500 mt-2">Insights avanzados para decisiones estratégicas</p>
            </div>
            <button
              onClick={loadAllData}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all shadow-md"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>
        </div>

        {/* 1. MEJORES CLIENTES */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-50 to-teal-50 p-6 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => toggleSection('customers')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mejores Clientes</h2>
                  <p className="text-sm text-gray-600">Top {topCustomers.length} clientes por volumen de compras</p>
                </div>
              </div>
              {expandedSections.customers ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>

          {expandedSections.customers && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Teléfono</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Compras</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Gastado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Ticket Promedio</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topCustomers.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Award className={`${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-400' :
                                'text-orange-500'
                              }`} size={16} />
                            )}
                            <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{customer.nombre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone size={12} />
                            {customer.telefono || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                            {customer.total_compras}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(customer.total_pagado)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">
                            {formatCurrency(customer.ticket_promedio)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {formatDate(customer.ultima_compra)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topCustomers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de clientes disponibles
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. PRODUCTOS DE BAJA ROTACIÓN */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-50 to-red-50 p-6 cursor-pointer hover:bg-orange-100 transition-colors"
            onClick={() => toggleSection('rotation')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Package className="text-orange-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Productos de Baja Rotación</h2>
                  <p className="text-sm text-gray-600">Productos con ventas menores en los últimos {rotationDays} días</p>
                </div>
              </div>
              {expandedSections.rotation ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>

          {expandedSections.rotation && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Aroma</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Presentación</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Stock</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Ventas ({rotationDays}d)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Dinero Inmovilizado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lowRotation.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.nombre}</p>
                            <p className="text-xs text-gray-500">{product.presentacion}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-green-100 text-black px-2 py-1 rounded-md text-xs font-medium">
                            {product.aroma}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">{product.presentacion}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold text-sm ${
                            product.stock > 50 ? 'text-orange-600' : 
                            product.stock > 20 ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            product.ventas_periodo === 0 ? 'bg-red-100 text-red-700' :
                            product.ventas_periodo < 5 ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {product.ventas_periodo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(product.dinero_inmovilizado)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">
                            {product.margen_porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lowRotation.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    ¡Excelente! Todos los productos tienen buena rotación
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. PREDICCIÓN DE VENTAS - DESHABILITADA TEMPORALMENTE */}
        {/* La sección de predicción de ventas está temporalmente deshabilitada */}

        {/* 4. MARGEN POR CATEGORÍA */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-50 to-pink-50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <BarChart3 className="text-purple-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Margen de Ganancia por Categoría</h2>
                  <p className="text-sm text-gray-600">Análisis de rentabilidad por aroma de producto</p>
                </div>
              </div>
              <button
                onClick={() => toggleSection('margin')}
                className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
              >
                {expandedSections.margin ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
            </div>
            
            {/* Filtros de Fecha */}
            <div className="flex flex-wrap items-end gap-3 bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={marginDateRange.fecha_inicio}
                  onChange={(e) => setMarginDateRange(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={marginDateRange.fecha_fin}
                  onChange={(e) => setMarginDateRange(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <button
                onClick={loadProfitMarginData}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-md flex items-center gap-2 text-sm font-medium"
              >
                <Calendar size={16} />
                Filtrar
              </button>
              <button
                onClick={() => {
                  setMarginDateRange({ fecha_inicio: '', fecha_fin: '' });
                  setTimeout(loadProfitMarginData, 100);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all text-sm font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>

          {expandedSections.margin && (
            <div className="p-6 space-y-6">
              {/* Totales Generales */}
              {profitTotals && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Ingresos Totales</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatCurrency(profitTotals.ingresos_totales)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium mb-1">Costos Totales</p>
                    <p className="text-xl font-bold text-orange-700">
                      {formatCurrency(profitTotals.costos_totales)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Ganancia Neta</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(profitTotals.ganancia_neta)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-1">Margen Global</p>
                    <p className="text-xl font-bold text-purple-700">
                      {profitTotals.margen_porcentaje}%
                    </p>
                  </div>
                </div>
              )}

              {/* Gráfico de Barras */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Ganancia por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="categoria" 
                      stroke="#9ca3af"
                      style={{ fontSize: '11px' }}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      style={{ fontSize: '11px' }}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend iconType="square" />
                    <Bar dataKey="ganancia_neta" fill="#10b981" name="Ganancia Neta" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla Detallada */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Categoría</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Productos</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Unidades</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Ingresos</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Costos</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Ganancia</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profitMargin.map((category) => (
                      <tr key={category.categoria} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{category.categoria}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">{category.num_productos}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">{category.unidades_vendidas}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(category.ingresos_totales)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-orange-600">
                            {formatCurrency(category.costos_totales)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(category.ganancia_neta)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            category.margen_porcentaje >= 50 ? 'bg-green-100 text-green-700' :
                            category.margen_porcentaje >= 30 ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {category.margen_porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {profitMargin.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de margen disponibles
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Analytics;
