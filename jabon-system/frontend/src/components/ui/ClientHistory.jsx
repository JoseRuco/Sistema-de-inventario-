import { useState, useEffect } from 'react';
import { X, ShoppingBag, DollarSign, Calendar, Package, AlertCircle } from 'lucide-react';
import { getClientHistory } from '../../services/api';

const ClientHistory = ({ isOpen, clientId, clientName, onClose }) => {
  const [client, setClient] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !clientId) return;
      
      try {
        setLoading(true);
        const response = await getClientHistory(clientId);
        setClient(response.data.client);
        setSales(response.data.sales || []);
      } catch (error) {
        console.error('Error cargando historial del cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, isOpen]);

const calculateTotal = () => {
  // Solo suma el dinero realmente pagado
  return sales.reduce((sum, sale) => {
    return sum + (sale.monto_pagado || 0);
  }, 0);
};

  const calculatePendingDebt = () => {
    return sales.reduce((sum, sale) => {
      return sum + (sale.monto_pendiente || 0);
    }, 0);
  };

  const getPendingSales = () => {
    return sales.filter(sale => 
      sale.estado_pago === 'pendiente' || sale.estado_pago === 'parcial'
    );
  };

  if (!isOpen) return null;

  const pendingDebt = calculatePendingDebt();
  const pendingSales = getPendingSales();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Historial de Compras</h2>
              <p className="text-blue-100 mt-1">{client?.nombre || clientName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-semibold">Cargando historial...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-semibold mb-1">Total Compras</p>
                      <p className="text-4xl font-bold text-blue-900">{sales.length}</p>
                    </div>
                    <div className="bg-blue-200 rounded-full p-3">
                      <ShoppingBag className="text-blue-700" size={32} />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-semibold mb-1">Total Gastado</p>
                      <p className="text-3xl font-bold text-green-900">
                        ${calculateTotal().toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-200 rounded-full p-3">
                      <DollarSign className="text-green-700" size={32} />
                    </div>
                  </div>
                </div>

                <div className={`bg-gradient-to-br rounded-xl p-5 border shadow-sm ${
                  pendingDebt > 0 
                    ? 'from-red-50 to-red-100 border-red-200' 
                    : 'from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${
                        pendingDebt > 0 ? 'text-red-700' : 'text-gray-600'
                      }`}>
                        Deuda Pendiente
                      </p>
                      <p className={`text-3xl font-bold ${
                        pendingDebt > 0 ? 'text-red-900' : 'text-gray-700'
                      }`}>
                        ${pendingDebt.toLocaleString()}
                      </p>
                      {pendingSales.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {pendingSales.length} venta{pendingSales.length !== 1 ? 's' : ''} pendiente{pendingSales.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className={`rounded-full p-3 ${
                      pendingDebt > 0 ? 'bg-red-200' : 'bg-gray-200'
                    }`}>
                      <AlertCircle className={pendingDebt > 0 ? 'text-red-700' : 'text-gray-500'} size={32} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventas Pendientes - Solo si hay deuda */}
              {pendingSales.length > 0 && (
                <div className="bg-red-50 rounded-xl p-5 border border-red-200 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="text-red-600" size={20} />
                    <h3 className="text-lg font-bold text-red-900">
                      Ventas con Deuda Pendiente ({pendingSales.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {pendingSales.map((sale) => (
                      <div key={sale.id} className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Calendar size={14} />
                              {new Date(sale.fecha).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <p className="text-sm text-gray-700">
                              Total: <span className="font-semibold">${sale.total.toLocaleString()}</span>
                            </p>
                            {sale.monto_pagado > 0 && (
                              <p className="text-xs text-green-600">
                                Pagado: ${sale.monto_pagado.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Debe</p>
                            <p className="text-2xl font-bold text-red-600">
                              ${sale.monto_pendiente.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Compras */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingBag size={24} className="text-blue-600" />
                  Compras Realizadas
                </h3>

                {sales.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg">
                    <ShoppingBag size={80} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-xl font-semibold">Sin compras registradas</p>
                    <p className="text-gray-400 mt-2">Este cliente aún no ha realizado compras</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sales.map((sale, index) => (
                      <div
                        key={sale.id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                      >
                        {/* Header de la venta */}
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 rounded-full px-3 py-1">
                              <span className="text-blue-700 font-bold text-sm">#{sale.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={16} />
                              <span className="text-sm font-medium">
                                {new Date(sale.fecha).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {sale.descuento && sale.descuento > 0 ? (
                              <>
                                <p className="text-xs text-gray-400 line-through">
                                  ${(sale.total + sale.descuento).toLocaleString()}
                                </p>
                                <p className="text-xs text-purple-600 font-semibold">
                                  Descuento: -${sale.descuento.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mb-1">Total</p>
                                <p className="text-2xl font-bold text-green-600">
                                  ${sale.total.toLocaleString()}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-gray-500 mb-1">Total</p>
                                <p className="text-2xl font-bold text-green-600">
                                  ${sale.total.toLocaleString()}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Info de pago */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="text-gray-400" size={18} />
                            <span className="text-sm text-gray-600">
                              <span className="font-semibold capitalize text-gray-800">{sale.metodo_pago || 'Efectivo'}</span>
                            </span>
                          </div>
                          
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            sale.estado_pago === 'pagado'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : sale.estado_pago === 'parcial'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                          }`}>
                            {sale.estado_pago === 'pagado' ? '✓ Pagado' :
                             sale.estado_pago === 'parcial' ? '◐ Parcial' :
                             '○ Pendiente'}
                          </span>
                        </div>

                        {/* Mostrar deuda si existe */}
                        {sale.monto_pendiente > 0 && (
                          <div className="mb-4 bg-red-50 rounded-lg p-3 border border-red-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-red-700 font-semibold">Monto Pendiente:</span>
                              <span className="text-lg font-bold text-red-600">
                                ${sale.monto_pendiente.toLocaleString()}
                              </span>
                            </div>
                            {sale.monto_pagado > 0 && (
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-green-700">Pagado:</span>
                                <span className="text-sm font-semibold text-green-600">
                                  ${sale.monto_pagado.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Productos */}
                        {sale.productos && sale.productos.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Package size={16} className="text-gray-600" />
                              <p className="text-sm font-bold text-gray-700">Productos ({sale.productos.length})</p>
                            </div>
                            <div className="space-y-2">
                              {sale.productos.map((producto, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{producto.producto_nombre}</p>
                                    <p className="text-xs text-gray-500">{producto.tipo} - {producto.presentacion}</p>
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="font-bold text-gray-800">${producto.subtotal.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">
                                      {producto.cantidad} x ${producto.precio_unitario.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {sales.length > 0 && `${sales.length} compra${sales.length !== 1 ? 's' : ''} registrada${sales.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientHistory;
