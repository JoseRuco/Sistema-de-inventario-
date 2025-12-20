import { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clients, setClients] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    countPending: 0,
    countPartial: 0,
    totalRecords: 0
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'pagado', 'pendiente', 'parcial'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Carga inicial
  useEffect(() => {
    loadClients();
    loadData(false);
  }, []);

  const loadClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadData = async (isLoadMore = false, overrideParams = {}) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1); 
      }

      const currentPage = isLoadMore ? page + 1 : 1;

      const params = {
        page: currentPage,
        limit: 50,
        search: searchTerm,
        clientId: filterClient,
        paymentMethod: filterPaymentMethod,
        paymentStatus: filterStatus,
        startDate: startDate,
        endDate: endDate,
        includeSummary: !isLoadMore,
        ...overrideParams // Permitir sobrescribir valores inmediatos
      };

      const response = await getSales(params);
      const { data, pagination, summary: serverSummary } = response.data;

      if (isLoadMore) {
        setSales(prev => [...prev, ...data]);
        setPage(currentPage);
      } else {
        setSales(data);
      }

      if (!isLoadMore) {
        setSummary(serverSummary);
      } else {
         // Update total records just in case it changed (since we fetch it in "else" block of controller)
         setSummary(prev => ({
             ...prev,
             totalRecords: serverSummary.totalRecords || prev.totalRecords
         }));
      }

      setHasMore(data.length === 50 && (isLoadMore ? sales.length + data.length : data.length) < (serverSummary.totalRecords || summary.totalRecords));

    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadData(true);
  };

  const handleViewDetails = async (saleId) => {
    setSelectedSale(saleId);
    setDetailsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClient('');
    setFilterPaymentMethod('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    loadData(false, {
      search: '',
      clientId: '',
      paymentMethod: '',
      paymentStatus: '',
      startDate: '',
      endDate: ''
    });
  };

  // Render simplificado: no desaparece todo al cargar
  const showInitialLoading = loading && page === 1 && sales.length === 0;

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
                <span>{summary?.totalRecords || 0} ventas registradas</span>
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
                placeholder="ID, cliente o producto..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="parcial">Parcial</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => loadData(false)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Search size={18} />
            Filtrar
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => {
            setFilterStatus('');
            loadData(false, { paymentStatus: '' });
          }}
          className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:scale-105 ${!filterStatus ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Ventas</p>
              <p className="text-3xl font-bold text-blue-600">{summary?.totalRecords || 0}</p>
            </div>
            <ShoppingCart className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-green-600">${(summary?.totalIncome || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="text-green-600" size={40} />
          </div>
        </div>

        <div 
          onClick={() => {
            const newStatus = filterStatus === 'pendiente' ? '' : 'pendiente';
            setFilterStatus(newStatus);
            loadData(false, { paymentStatus: newStatus });
          }}
          className={`bg-red-50 border border-red-200 rounded-lg shadow-md p-6 cursor-pointer transition-all hover:scale-105 ${filterStatus === 'pendiente' ? 'ring-2 ring-red-500 scale-105 shadow-lg' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium mb-1">Ventas Pendientes</p>
              <p className="text-3xl font-bold text-red-600">
                {summary.countPending}
              </p>
              <p className="text-xs text-red-500 mt-1">Sin pagar</p>
            </div>
            <AlertCircle className="text-red-600" size={40} />
          </div>
        </div>

        <div 
          onClick={() => {
            const newStatus = filterStatus === 'parcial' ? '' : 'parcial';
            setFilterStatus(newStatus);
            loadData(false, { paymentStatus: newStatus });
          }}
          className={`bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-6 cursor-pointer transition-all hover:scale-105 ${filterStatus === 'parcial' ? 'ring-2 ring-yellow-500 scale-105 shadow-lg' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium mb-1">Ventas Parciales</p>
              <p className="text-3xl font-bold text-yellow-700">
                {summary.countPartial}
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
            <tbody className="divide-y divide-gray-200 relative">
              {showInitialLoading && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center bg-white bg-opacity-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando ventas...</p>
                  </td>
                </tr>
              )}
              {!showInitialLoading && sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No se encontraron ventas</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={`${sale.id}-${sale.fecha}`} className="hover:bg-gray-50 transition-colors">
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
        
        {/* Load More Button */}
        {hasMore && (
           <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
             <button
               onClick={handleLoadMore}
               disabled={loadingMore}
               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
             >
               {loadingMore ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   Cargando...
                 </>
               ) : (
                 'Mostrar más'
               )}
             </button>
           </div>
        )}
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
