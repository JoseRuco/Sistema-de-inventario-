import { useState, useEffect } from 'react';
import { DollarSign, Users, AlertCircle, TrendingUp, Calendar, User, CreditCard, Plus, Eye, FileText } from 'lucide-react';
import { getPendingDebts, getPortfolioSummary, registerPayment, getPaymentHistory } from '../../services/api';
import PaymentModal from './PaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import SaleDetailsModal from './SaleDetailsModal';
import SuccessModal from './SuccessModal';

const Credits = () => {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({
    total_ventas_pendientes: 0,
    total_pendiente: 0,
    clientes_con_deuda: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pendiente, parcial

  // Modales
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    debt: null
  });
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    ventaId: null
  });
  const [saleDetailsModal, setSaleDetailsModal] = useState({
    isOpen: false,
    ventaId: null
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    amount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtsRes, summaryRes] = await Promise.all([
        getPendingDebts(),
        getPortfolioSummary()
      ]);

      setDebts(debtsRes.data.data || []);
      setSummary(summaryRes.data.data || {
        total_ventas_pendientes: 0,
        total_pendiente: 0,
        clientes_con_deuda: 0
      });
    } catch (error) {
      console.error('Error cargando datos de créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async (paymentData) => {
    try {
      await registerPayment(paymentData);
      setPaymentModal({ isOpen: false, debt: null });
      setSuccessModal({
        isOpen: true,
        title: '¡Abono Registrado!',
        message: 'El abono se ha registrado exitosamente',
        amount: paymentData.monto
      });
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al registrar el abono');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (estado) => {
    const configs = {
      pendiente: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Pendiente'
      },
      parcial: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Parcial'
      }
    };

    const config = configs[estado] || configs.pendiente;

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.id.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || debt.estado_pago === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Cargando cuentas por cobrar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-red-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <CreditCard className="w-8 h-8" />
              </div>
              Cuentas por Cobrar
            </h2>
            <p className="text-orange-100 mt-2">Gestión de ventas fiadas y abonos</p>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white bg-opacity-30 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Total por Cobrar</p>
                <p className="text-2xl font-bold">${(summary.total_pendiente || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white bg-opacity-30 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Facturas</p>
                <p className="text-2xl font-bold">{summary.total_ventas_pendientes || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white bg-opacity-30 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Clientes</p>
                <p className="text-2xl font-bold">{summary.clientes_con_deuda || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white bg-opacity-30 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Solo Pendientes</p>
                <p className="text-2xl font-bold">{summary.count_pendiente || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white bg-opacity-30 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Solo Parcial</p>
                <p className="text-2xl font-bold">{summary.count_parcial || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por cliente o ID de venta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {/* Filtro de estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Solo pendientes</option>
            <option value="parcial">Solo pagos parciales</option>
          </select>
        </div>
      </div>

      {/* Tabla de deudas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500 to-red-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Venta</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Total</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Pagado</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Pendiente</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">
                        No hay deudas pendientes
                      </h3>
                      <p className="text-gray-500">
                        {debts.length === 0
                          ? '¡Excelente! No hay ventas fiadas pendientes'
                          : 'No se encontraron resultados con los filtros aplicados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-black">
                        #{debt.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(debt.fecha)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{debt.cliente_nombre || 'N/A'}</p>
                        {debt.cliente_telefono && (
                          <p className="text-xs text-gray-500">{debt.cliente_telefono}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-100 py-4">
                      {getStatusBadge(debt.estado_pago)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      ${debt.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      ${debt.monto_pagado.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      ${debt.monto_pendiente.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSaleDetailsModal({ isOpen: true, ventaId: debt.id })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                          title="Ver detalle de la venta"
                        >
                          <FileText className="w-4 h-4" />
                          Detalle
                        </button>
                        <button
                          onClick={() => setPaymentModal({ isOpen: true, debt })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Abonar
                        </button>
                        <button
                          onClick={() => setHistoryModal({ isOpen: true, ventaId: debt.id })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {paymentModal.isOpen && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          debt={paymentModal.debt}
          onClose={() => setPaymentModal({ isOpen: false, debt: null })}
          onSubmit={handleRegisterPayment}
        />
      )}

      {historyModal.isOpen && (
        <PaymentHistoryModal
          isOpen={historyModal.isOpen}
          ventaId={historyModal.ventaId}
          onClose={() => setHistoryModal({ isOpen: false, ventaId: null })}
        />
      )}

      {saleDetailsModal.isOpen && (
        <SaleDetailsModal
          isOpen={saleDetailsModal.isOpen}
          ventaId={saleDetailsModal.ventaId}
          onClose={() => setSaleDetailsModal({ isOpen: false, ventaId: null })}
        />
      )}

      {successModal.isOpen && (
        <SuccessModal
          isOpen={successModal.isOpen}
          title={successModal.title}
          message={successModal.message}
          amount={successModal.amount}
          onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        />
      )}
    </div>
  );
};

export default Credits;
