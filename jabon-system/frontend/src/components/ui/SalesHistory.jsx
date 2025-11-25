import { useState, useEffect } from 'react';
import { Search, Eye, ShoppingCart, DollarSign, Calendar, CreditCard, Wallet, User, AlertCircle } from 'lucide-react';
import { getSales, getSale, getClients } from '../../services/api';
import SaleDetailsModal from './SaleDetailsModal';

// --- Helpers de fecha ---
function toISODate(input) {
  if (!input) return null;
  const t = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(t);
  if (m) {
    const [_, dd, mm, yy] = m;
    const yyyy = Number(yy) <= 69 ? `20${yy}` : `19${yy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function getSaleDayISO(fecha) {
  if (!fecha) return '';
  const t = String(fecha).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    return t.substring(0, 10);
  }
  return toISODate(t) || '';
}

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesRes, clientsRes] = await Promise.all([
        getSales(),
        getClients()
      ]);

      setSales(salesRes.data.data || salesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (saleId) => {
    setSelectedSale(saleId);
    setDetailsModalOpen(true);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.id.toString().includes(searchTerm) ||
      (sale.cliente_nombre && sale.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClient = !filterClient || sale.cliente_id?.toString() === filterClient;
    const matchesPaymentMethod = !filterPaymentMethod || sale.metodo_pago === filterPaymentMethod;

    let matchesDateRange = true;
    if (startDate || endDate) {
      const saleDay = getSaleDayISO(sale.fecha);
      if (startDate && saleDay < startDate) matchesDateRange = false;
      if (endDate && saleDay > endDate) matchesDateRange = false;
    }

    return matchesSearch && matchesClient && matchesPaymentMethod && matchesDateRange;
  });

  // ✅ SOLO SUMA DINERO PAGADO
  const totalVentas = filteredSales.reduce((sum, sale) => sum + (sale.monto_pagado || 0), 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClient('');
    setFilterPaymentMethod('');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <ShoppingCart className="w-8 h-8" />
              </div>
              Historial de Ventas
            </h2>
            <p className="text-green-100 mt-2">Consulta y gestiona todas las ventas realizadas</p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>{filteredSales.length} ventas registradas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ID o cliente..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {(searchTerm || filterClient || filterPaymentMethod || startDate || endDate) && (
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Ventas</p>
              <p className="text-3xl font-bold text-blue-600">{filteredSales.length}</p>
            </div>
            <ShoppingCart className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-green-600">${totalVentas.toLocaleString()}</p>
            </div>
            <DollarSign className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium mb-1">Ventas Pendientes</p>
              <p className="text-3xl font-bold text-red-600">
                {filteredSales.filter(sale => sale.estado_pago === 'pendiente').length}
              </p>
              <p className="text-xs text-red-500 mt-1">Sin pagar</p>
            </div>
            <AlertCircle className="text-red-600" size={40} />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium mb-1">Ventas Parciales</p>
              <p className="text-3xl font-bold text-yellow-700">
                {filteredSales.filter(sale => sale.estado_pago === 'parcial').length}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Pago parcial</p>
            </div>
            <AlertCircle className="text-yellow-600" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Método</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No se encontraron ventas</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">#{sale.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(sale.fecha).toLocaleString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User size={14} className="text-gray-400" />
                        {sale.cliente_nombre || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-green-600">
                        ${sale.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {sale.metodo_pago === 'efectivo' && <DollarSign size={14} className="text-green-600" />}
                        {sale.metodo_pago === 'tarjeta' && <CreditCard size={14} className="text-blue-600" />}
                        {sale.metodo_pago === 'transferencia' && <Wallet size={14} className="text-purple-600" />}
                        <span className="text-sm capitalize">{sale.metodo_pago}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.estado_pago === 'pagado'
                        ? 'bg-green-100 text-green-700'
                        : sale.estado_pago === 'parcial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {sale.estado_pago === 'pagado' ? 'Pagado' :
                          sale.estado_pago === 'parcial' ? 'Parcial' :
                            'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewDetails(sale.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetailsModal
        isOpen={detailsModalOpen}
        ventaId={selectedSale}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedSale(null);
        }}
      />
    </div>
  );
};

export default SalesHistory;
