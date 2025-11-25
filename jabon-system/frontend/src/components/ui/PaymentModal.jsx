import { useState } from 'react';
import { X, DollarSign, CreditCard, Wallet, FileText } from 'lucide-react';
import Portal from './Portal';

const PaymentModal = ({ isOpen, debt, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    monto: '',
    metodo_pago: 'efectivo',
    notas: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !debt) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors = {};
    const monto = parseFloat(formData.monto);

    if (!formData.monto || monto <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    if (monto > debt.monto_pendiente) {
      newErrors.monto = 'El monto no puede ser mayor al saldo pendiente';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Enviar datos
    onSubmit({
      venta_id: debt.id,
      cliente_id: debt.cliente_id,
      monto: parseFloat(formData.monto),
      metodo_pago: formData.metodo_pago,
      notas: formData.notas
    });

    // Resetear formulario
    setFormData({ monto: '', metodo_pago: 'efectivo', notas: '' });
    setErrors({});
  };

  const handleMontoChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, monto: value });
    setErrors({ ...errors, monto: null });
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Registrar Abono</h3>
                <p className="text-green-100 text-sm mt-1">Venta #{debt.id}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Info de la venta */}
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-100">Cliente</p>
                  <p className="font-semibold">{debt.cliente_nombre}</p>
                </div>
                <div>
                  <p className="text-green-100">Total Venta</p>
                  <p className="font-semibold">${debt.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-green-100">Pagado</p>
                  <p className="font-semibold text-green-200">${debt.monto_pagado.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-green-100">Pendiente</p>
                  <p className="font-semibold text-yellow-200">${debt.monto_pendiente.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Monto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monto del Abono *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={debt.monto_pendiente}
                  required
                  value={formData.monto}
                  onChange={handleMontoChange}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.monto ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="0.00"
                />
              </div>
              {errors.monto && (
                <p className="text-red-500 text-sm mt-1">{errors.monto}</p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, monto: (debt.monto_pendiente / 2).toFixed(2) })}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, monto: debt.monto_pendiente.toFixed(2) })}
                  className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                >
                  Pagar Todo
                </button>
              </div>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, metodo_pago: 'efectivo' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.metodo_pago === 'efectivo'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">Efectivo</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, metodo_pago: 'transferencia' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.metodo_pago === 'transferencia'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">Transfer.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, metodo_pago: 'tarjeta' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.metodo_pago === 'tarjeta'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notas (Opcional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Información adicional del abono..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold shadow-md"
              >
                Registrar Abono
              </button>
            </div>
          </form>

        </div>
      </div>
    </Portal>
  );
};

export default PaymentModal;
