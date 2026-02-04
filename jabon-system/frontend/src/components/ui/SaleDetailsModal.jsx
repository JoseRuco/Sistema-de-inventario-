import { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, MapPin, Package, CreditCard, DollarSign, FileText } from 'lucide-react';
import { getSale } from '../../services/api';
import Portal from './Portal';

const SaleDetailsModal = ({ isOpen, ventaId, onClose }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && ventaId) {
      loadSaleDetails();
    }
  }, [isOpen, ventaId]);

  const loadSaleDetails = async () => {
    setLoading(true);
    try {
      const response = await getSale(ventaId);
      setSale(response.data.data);
    } catch (error) {
      console.error('Error cargando detalles de venta:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-center mt-4 text-gray-600">Cargando detalles...</p>
          </div>
        </div>
      </Portal>
    );
  }

  if (!sale) {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <p className="text-center text-red-600">Error al cargar los detalles de la venta</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors w-full"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Portal>
    );
  }

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Detalles de Venta #{sale.id}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {new Date(sale.fecha).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">

          {/* Información del Cliente */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <p className="font-semibold">{sale.cliente_nombre || 'N/A'}</p>
              </div>
              {sale.telefono && (
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <p className="font-semibold">{sale.telefono}</p>
                </div>
              )}
              {sale.direccion && (
                <div className="col-span-2">
                  <span className="text-gray-600">Dirección:</span>
                  <p className="font-semibold">{sale.direccion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              Productos
            </h3>

            {sale.detalles && sale.detalles.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Producto</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Cant.</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Precio</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.detalles.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">
                            {detail.producto_nombre || 'Producto'}
                          </p>
                          {detail.aroma && detail.presentacion && (
                            <p className="text-xs text-gray-500">
                              {detail.aroma} - {detail.presentacion}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-sm">
                          {detail.cantidad || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          ${(detail.precio_unitario || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600 text-sm">
                          ${(detail.subtotal || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                <Package size={48} className="mx-auto mb-2 text-gray-400" />
                <p>No hay detalles de productos disponibles</p>
              </div>
            )}
          </div>

          {/* Notas de la Venta */}
          {sale.notas && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <FileText size={18} className="text-yellow-600" />
                Nota de Venta
              </h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{sale.notas}</p>
            </div>
          )}

          {/* Resumen de Pago */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-blue-600" />
              Resumen de Pago
            </h3>

            <div className="space-y-3">
              {/* Mostrar descuento si existe */}
              {sale.descuento && sale.descuento > 0 ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-800">
                      ${((sale.total || 0) + (sale.descuento || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-purple-600 font-medium">Descuento Ocasional:</span>
                    <span className="font-semibold text-purple-600">
                      -${(sale.descuento || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200 pt-2">
                    <span className="text-gray-700 font-medium">Total:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      ${(sale.total || 0).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Total:</span>
                  <span className="text-2xl font-bold text-blue-700">
                    ${(sale.total || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <CreditCard size={16} />
                  Método de Pago:
                </span>
                <span className="font-semibold text-gray-800 capitalize">
                  {sale.metodo_pago || 'No especificado'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Estado:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sale.estado_pago === 'pagado'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : sale.estado_pago === 'parcial'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                  {sale.estado_pago === 'pagado' ? '✓ Pagado' :
                    sale.estado_pago === 'parcial' ? '◐ Pago Parcial' :
                      sale.estado_pago === 'pendiente' ? '○ Pendiente' : 'Desconocido'}
                </span>
              </div>

              {(sale.estado_pago === 'parcial' || sale.estado_pago === 'pendiente') && (
                <>
                  <div className="pt-3 border-t border-blue-200 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Monto Pagado:</span>
                      <span className="font-semibold text-green-600">
                        ${(sale.monto_pagado || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Monto Pendiente:</span>
                      <span className="font-bold text-red-600">
                        ${(sale.monto_pendiente || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
    </Portal>
  );
};

export default SaleDetailsModal;
