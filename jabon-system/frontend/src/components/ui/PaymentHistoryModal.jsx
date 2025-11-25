import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CreditCard, FileText } from 'lucide-react';
import { getPaymentHistory } from '../../services/api';
import Portal from './Portal';

const PaymentHistoryModal = ({ isOpen, ventaId, onClose }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && ventaId) {
      loadPaymentHistory();
    }
  }, [isOpen, ventaId]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await getPaymentHistory(ventaId);
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Error cargando historial de pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodBadge = (method) => {
    const methods = {
      efectivo: { label: 'Efectivo', bg: 'bg-green-100', text: 'text-green-700' },
      transferencia: { label: 'Transferencia', bg: 'bg-blue-100', text: 'text-blue-700' },
      tarjeta: { label: 'Tarjeta', bg: 'bg-purple-100', text: 'text-purple-700' }
    };

    const config = methods[method] || methods.efectivo;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const totalAbonado = payments.reduce((sum, payment) => sum + payment.monto, 0);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Historial de Abonos</h3>
                <p className="text-blue-100 text-sm mt-1">Venta #{ventaId}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Resumen */}
            {!loading && payments.length > 0 && (
              <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Abonado</p>
                    <p className="text-2xl font-bold">${totalAbonado.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Número de Abonos</p>
                    <p className="text-2xl font-bold">{payments.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-500">Cargando historial...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin abonos registrados</h3>
                <p className="text-gray-500">Esta venta aún no tiene abonos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              Abono #{payments.length - index}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(payment.fecha)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pl-11">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Monto</p>
                            <p className="text-lg font-bold text-green-600">
                              ${payment.monto.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Método de Pago</p>
                            {getPaymentMethodBadge(payment.metodo_pago)}
                          </div>
                        </div>

                        {payment.notas && (
                          <div className="mt-3 pl-11">
                            <div className="flex items-start gap-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                              <p className="text-black italic">{payment.notas}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};

export default PaymentHistoryModal;
