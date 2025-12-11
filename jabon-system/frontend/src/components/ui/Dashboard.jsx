import { useState, useEffect } from 'react';
import { Package, Users, DollarSign, TrendingUp, AlertTriangle, RefreshCw, ShoppingCart, Calendar, Eye, Award, Truck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getChartData, getSalesByTypeMonth, getPendingOrdersCount } from '../../services/api';



const Dashboard = () => {
  const [salesByType, setSalesByType] = useState([]);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    loadData();
    getSalesByTypeMonth().then(res => setSalesByType(res.data.salesByType || []));
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        getDashboardStats(),
        getChartData()
      ]);

      setStats(statsRes.data);
      setCharts(chartsRes.data);
      
      const ordersRes = await getPendingOrdersCount();
      setPendingOrders(ordersRes.data.count || 0);
    } catch (error) {
      console.error('❌ Error:', error);
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Calcular ventas del mes por tipo
  const getSalesByTypeThisMonth = () => {
    if (!charts?.topProducts) return [];

    const typeMap = {};
    charts.topProducts.forEach(product => {
      const tipo = product.tipo || 'Sin tipo';
      if (!typeMap[tipo]) {
        typeMap[tipo] = 0;
      }
      typeMap[tipo] += product.cantidad_vendida;
    });

    return Object.entries(typeMap).map(([name, cantidad]) => ({
      name,
      cantidad
    }));
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <h2 className="text-red-600 font-bold text-xl mb-3 text-center">Error al cargar</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <button
            onClick={loadData}
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

        {/* Header con fecha */}



        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Productos */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500 font-medium">Total Productos</span>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalProducts || 0}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3 shadow-sm">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Eye size={12} />
              <span>Activos en inventario</span>
            </div>
          </div>

          {/* Total Clientes */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500 font-medium">Total Clientes</span>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalClients || 0}</p>
              </div>
              <div className="bg-green-100 rounded-xl p-3 shadow-sm">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Eye size={12} />
              <span>Clientes registrados</span>
            </div>
          </div>

          {/* Ventas Hoy */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-50 rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500 font-medium">Ventas Hoy</span>
                <p className="text-3xl font-bold text-gray-900 mt-1">${(stats?.salesToday?.total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 rounded-xl p-3 shadow-sm">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <ShoppingCart size={12} />
              <span>{stats?.salesToday?.count || 0} ventas realizadas</span>
            </div>
          </div>

          {/* Ventas del Mes */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500 font-medium">Ventas del Mes</span>
                <p className="text-3xl font-bold text-gray-900 mt-1">${(stats?.salesMonth?.total || 0).toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 rounded-xl p-3 shadow-sm">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600">
              <ShoppingCart size={12} />
              <span>{stats?.salesMonth?.count || 0} ventas este mes</span>
            </div>
          </div>

          {/* Pedidos Pendientes */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500 font-medium">Pedidos Pendientes</span>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingOrders}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3 shadow-sm">
                <Truck className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Truck size={12} />
              <span>{pendingOrders === 0 ? 'Sin pedidos pendientes' : 'Por entregar'}</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas Últimos 30 Días */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <TrendingUp className="text-blue-600" size={18} />
                </div>
                Ventas Últimos 30 Días
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={charts?.salesByDay || []}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="fecha"
                  stroke="#999"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#666' }}
                />
                <YAxis
                  stroke="#999"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#666' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '13px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => {
                    if (typeof value === 'number' && value > 1000) {
                      return `$${value.toLocaleString()}`;
                    }
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Ingresos ($)"
                  dot={{ r: 3 }}
                  activeDot={{ r: 8 }}
                  fill="url(#colorIngresos)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ventas por Tipo de Producto */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="bg-green-100 rounded-lg p-2">
                  <ShoppingCart className="text-green-600" size={18} />
                </div>
                Ventas por Tipo de Producto
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="gray" />
                <XAxis dataKey="tipo" tick={{ fill: '#666' }} />
                <YAxis tick={{ fill: '#666' }} />
                <Tooltip />
                <Bar dataKey="cantidad_vendida" fill="#3b82f6" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas Recientes */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <ShoppingCart className="text-purple-600" size={18} />
              </div>
              Ventas Recientes
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <DollarSign className="text-purple-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{sale.cliente_nombre || 'Cliente General'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(sale.fecha).toLocaleString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">${sale.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{sale.metodo_pago}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm">No hay ventas recientes</p>
              )}
            </div>
          </div>

          {/* Alerta de Stock Bajo */}
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-red-100 rounded-lg p-2">
                <AlertTriangle className="text-red-600" size={18} />
              </div>
              Alerta de Stock Bajo
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.lowStock && stats.lowStock.length > 0 ? (
                stats.lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-red-100 rounded-lg p-2">
                        <Package className="text-red-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{product.nombre}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {product.tipo} • {product.presentacion}
                        </p>
                      </div>
                    </div>
                    <span className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold ml-3 shadow-md">
                      {product.stock} unid.
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-green-50 rounded-xl border border-green-200">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Package className="text-green-600" size={24} />
                  </div>
                  <p className="text-green-600 font-semibold text-sm">✓ Stock Suficiente</p>
                  <p className="text-gray-500 text-xs mt-1">Todos los productos están bien surtidos</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabla Top 10 Productos */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-yellow-100 rounded-lg p-2">
              <Award className="text-yellow-600" size={18} />
            </div>
            Top Productos del Mes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Presentación</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Vendido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charts?.topProducts && charts.topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <Award className={`${index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                              'text-orange-500'
                            }`} size={16} />
                        ) : null}
                        <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{product.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                        {product.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{product.presentacion}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {product.cantidad_vendida}
                        {product.cantidad_vendida === 0 && (
                          <span className="ml-2 text-xs text-red-500 font-normal">(Sin venta)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-green-600">${product.total_vendido?.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!charts?.topProducts || charts.topProducts.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
