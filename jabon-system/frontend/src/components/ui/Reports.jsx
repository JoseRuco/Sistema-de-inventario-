import { useState } from 'react';
import { FileText, Download, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getReports, getTopProducts } from '../../services/api';

const Reports = () => {
  // Obtener fecha actual en Colombia
  const getColombiaDate = () => {
    const now = new Date();
    const colombiaTime = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
    const colombiaDate = new Date(colombiaTime);
    return colombiaDate.toISOString().split('T')[0];
  };

  // Obtener primer día del mes en Colombia
  const getFirstDayOfMonth = () => {
    const now = new Date();
    const colombiaTime = now.toLocaleString('en-US', { timeZone: 'America/Bogota' });
    const colombiaDate = new Date(colombiaTime);
    const firstDay = new Date(colombiaDate.getFullYear(), colombiaDate.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  const [reportType, setReportType] = useState('ventas');
  const [dateRange, setDateRange] = useState({
    fecha_inicio: getFirstDayOfMonth(),
    fecha_fin: getColombiaDate()
  });
  const [reportData, setReportData] = useState(null);
  const [reportTotals, setReportTotals] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReportTypeChange = (newType) => {
    setReportType(newType);
    setReportData(null);
    setReportTotals(null);
    setTopProducts(null);
  };

  const generateReport = async () => {
    if (!dateRange.fecha_inicio || !dateRange.fecha_fin) {
      alert('Por favor seleccione un rango de fechas');
      return;
    }

    setLoading(true);
    try {
      const response = await getReports({
        ...dateRange,
        tipo: reportType
      });

      setReportData(response.data.data);
      setReportTotals({
        totalSales: response.data.totalVentas,
        totalRevenue: response.data.totalIngresos,
        totalProfit: response.data.totalGanancias,
        unpaidSales: response.data.unpaidSales || 0 // Agregar contador de ventas sin pagar
      });

      if (reportType === 'ganancias') {
        console.log('🔍 Llamando getTopProducts con rango:', dateRange);
        setTopProducts(null);
        const topResponse = await getTopProducts(dateRange);
        console.log('📦 Productos recibidos:', topResponse.data.length);
        setTopProducts(topResponse.data);
      } else {
        setTopProducts(null);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte');
      setReportData(null);
      setReportTotals(null);
      setTopProducts(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData || reportData.length === 0) return;

    let csvContent = '';

    if (reportType === 'ventas') {
      csvContent = 'ID,Fecha,Cliente,Total,Ganancia\n';
      reportData.forEach(sale => {
        csvContent += `${sale.id},${sale.fecha},${sale.cliente_nombre || 'Sin cliente'},${sale.total},${sale.ganancia}\n`;
      });
    } else if (reportType === 'ganancias') {
      csvContent = 'Fecha,Número de Ventas,Total Ventas,Ganancia Total\n';
      reportData.forEach(row => {
        csvContent += `${row.fecha},${row.num_ventas},${row.total_ventas},${row.ganancia_total}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${reportType}_${dateRange.fecha_inicio}_${dateRange.fecha_fin}.csv`;
    a.click();
  };

  const stats = reportTotals || { totalSales: 0, totalRevenue: 0, totalProfit: 0 };

  // Calcular ventas sin pagar (pendientes o parciales)
  const unpaidSales = reportType === 'ventas'
    ? (reportData ? reportData.filter(sale =>
      sale.estado_pago === 'pendiente' || sale.estado_pago === 'parcial'
    ).length : 0)
    : (reportTotals?.unpaidSales || 0); // Para tipo 'ganancias', usar el valor del backend

  const chartData = reportType === 'ganancias' && reportData
    ? reportData.map(row => ({
      fecha: row.fecha,
      'Total Ventas ($)': parseFloat(row.total_ventas) || 0,
      'Ganancia ($)': parseFloat(row.ganancia_total) || 0
    }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">REPORTES</h1>
        <p className="text-gray-600">Genera y descarga reportes de ventas y ganancias</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ventas">Venta Detallada</option>
              <option value="ganancias">Resumen de Ganancias</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.fecha_inicio}
              onChange={(e) => setDateRange({ ...dateRange, fecha_inicio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={dateRange.fecha_fin}
              onChange={(e) => setDateRange({ ...dateRange, fecha_fin: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && reportData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Ventas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSales}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
              </div>
            </div>

             {/* Nueva tarjeta de Descuentos */}
              {stats.totalDiscounts > 0 && (
                <div className="card bg-purple-50 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm mb-1 font-medium">Descuentos Aplicados</p>
                      <p className="text-3xl font-bold text-purple-600">
                        ${stats.totalDiscounts.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-500 mt-1">Descuentos ocasionales</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <DollarSign size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>
              )}

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Ganancias Totales</p>
                  <p className="text-3xl font-bold text-purple-600">
                    ${stats.totalProfit.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm mb-1 font-medium">Ventas Sin Pagar</p>
                  <p className="text-3xl font-bold text-red-600">{unpaidSales}</p>
                  <p className="text-xs text-red-500 mt-1">
                    {unpaidSales === 1 ? 'venta pendiente' : 'ventas pendientes'}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Ventas por Producto - SIEMPRE SE MUESTRA SI topProducts EXISTE */}
          {reportType === 'ganancias' && topProducts && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={24} className="text-blue-600" />
                  <h3 className="text-lg font-semibold">Ventas por Producto (Rango Seleccionado)</h3>
                </div>
                <span className="text-sm text-gray-600">
                  Total: {topProducts.length} productos
                </span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presentación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades Vendidas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((product) => (
                      <tr key={product.id} className={`hover:bg-gray-50 ${product.total_vendido === 0 ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.nombre}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {product.tipo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                            {product.presentacion.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {product.total_vendido}
                          {product.total_vendido === 0 && (
                            <span className="ml-2 text-xs text-red-500">(Sin ventas)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                          ${product.total_ingresos.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-600 font-semibold">
                          ${product.ganancia_total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chart for Ganancias Report */}
          {reportType === 'ganancias' && chartData.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Ventas por Día (Rango Seleccionado)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Total Ventas ($)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Ganancia ($)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {reportType === 'ventas' ? 'Detalle de Ventas' : 'Resumen por Fecha'}
              </h3>
              <button
                onClick={downloadReport}
                className="btn flex items-center gap-2"
              >
                <Download size={18} />
                Descargar CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {reportType === 'ventas' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ventas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ganancia Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportType === 'ventas' ? (
                    reportData.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{sale.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sale.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.cliente_nombre || 'Sin cliente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(parseFloat(sale.total) || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          ${(parseFloat(sale.ganancia) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    reportData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.fecha.split('-').reverse().join('/')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.num_ventas}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(parseFloat(row.total_ventas) || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          ${(parseFloat(row.ganancia_total) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reportData && reportData.length === 0 && (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No hay datos para el rango de fechas seleccionado</p>
        </div>
      )}

      {!reportData && (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Selecciona un rango de fechas y genera un reporte</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
