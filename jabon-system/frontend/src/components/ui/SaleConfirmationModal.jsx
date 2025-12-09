import { X, Check, Package, AlertTriangle } from 'lucide-react';

const SaleConfirmationModal = ({ isOpen, cart, total, paymentType, paymentMethod, partialPayment, occasionalDiscount = 0, clientDebt = 0, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const getPresentationBadgeColor = (presentacion) => {
        const lower = presentacion.toLowerCase();
        if (lower.includes('galón') || lower.includes('galon')) {
            return 'bg-purple-100 text-purple-800 border-purple-300';
        }
        if (lower.includes('medio')) {
            return 'bg-blue-100 text-blue-800 border-blue-300';
        }
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const totalProducts = cart.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = parseFloat(occasionalDiscount) || 0;

    // Cálculos de deuda
    const abono = parseFloat(partialPayment) || 0;
    const nuevoSaldo = paymentType === 'credito' ? total - abono : 0;
    const deudaTotalProyectada = clientDebt + nuevoSaldo;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden animate-scale-in flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 md:p-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-white bg-opacity-20 p-1.5 rounded-lg">
                                <Package className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">Confirmar Venta</h2>
                                <p className="text-blue-100 text-xs">{totalProducts} producto{totalProducts !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Products List - Scrollable */}
                <div className="overflow-y-auto flex-1 p-3 md:p-4 bg-gray-100">
                    <div className="space-y-2">
                        {cart.map((item, index) => (
                            <div
                                key={item.producto_id}
                                className="bg-gradient-to-br from-gray-200 to-gray-200 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-sm">{item.nombre}</h3>
                                        <p className="text-xs text-gray-500">{item.tipo}</p>
                                    </div>
                                    <div className="text-right ml-2">
                                        <p className="text-xs text-gray-500">Cant.</p>
                                        <p className="font-bold text-base text-blue-600">{item.cantidad}</p>
                                    </div>
                                </div>

                                {/* Presentación destacada */}
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs font-semibold text-gray-600">Presentación:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 ${getPresentationBadgeColor(item.presentacion)}`}>
                                        {item.presentacion}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
                                    <span className="text-xs text-gray-600">
                                        ${item.precio_unitario.toLocaleString()} × {item.cantidad}
                                    </span>
                                    <span className="font-bold text-green-600 text-base">
                                        ${item.subtotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary - Fixed at bottom */}
                <div className="border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex-shrink-0">
                    <div className="space-y-2">

                        {/* Alerta de Deuda Pendiente */}
                        {clientDebt > 0 && (
                            <div className="bg-red-50 border border-red-200 p-2 rounded-lg mb-2">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="text-red-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-red-800">¡Cliente con Deuda!</p>
                                        <div className="flex justify-between items-center mt-0.5 text-xs">
                                            <span className="text-gray-600">Deuda Actual:</span>
                                            <span className="font-bold text-red-600">${clientDebt.toLocaleString()}</span>
                                        </div>
                                        {paymentType === 'credito' && (
                                            <div className="flex justify-between items-center mt-0.5 text-xs border-t border-red-200 pt-0.5">
                                                <span className="text-gray-800 font-semibold">Nueva Deuda Total:</span>
                                                <span className="font-bold text-red-700 text-sm">${deudaTotalProyectada.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Type */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Tipo de Pago:</span>
                            <span className={`px-2 py-0.5 rounded-lg font-bold text-xs ${paymentType === 'credito'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {paymentType === 'credito' ? 'Fiado' : 'Contado'}
                            </span>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Método:</span>
                            <span className="px-2 py-0.5 rounded-lg font-semibold text-xs bg-blue-100 text-blue-700">
                                {paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                            </span>
                        </div>

                        {/* Partial Payment Info */}
                        {paymentType === 'credito' && partialPayment && parseFloat(partialPayment) > 0 && (
                            <div className="bg-orange-50 p-2 rounded-lg space-y-1 border border-orange-200">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Abono Inicial:</span>
                                    <span className="font-bold text-green-600">
                                        ${parseFloat(partialPayment).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Pendiente:</span>
                                    <span className="font-bold text-orange-600">
                                        ${(total - parseFloat(partialPayment)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Discount Info */}
                        {discount > 0 && (
                            <div className="bg-purple-50 p-2 rounded-lg space-y-1 border border-purple-200">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-bold text-gray-800">
                                        ${subtotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-purple-600 font-semibold">Descuento Ocasional:</span>
                                    <span className="font-bold text-purple-600">
                                        -${discount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                            <span className="text-base md:text-lg font-bold text-gray-800">TOTAL:</span>
                            <span className="text-xl md:text-2xl font-bold text-green-600">
                                ${total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions - Fixed at bottom */}
                <div className="p-3 md:p-4 pt-0 bg-gray-50 flex gap-2 flex-shrink-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 md:py-3 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-2 py-2.5 md:py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm ${paymentType === 'credito'
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                            }`}
                        style={{ flex: 2 }}
                    >
                        <Check size={18} />
                        <span>CONFIRMO</span>
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};

export default SaleConfirmationModal;
