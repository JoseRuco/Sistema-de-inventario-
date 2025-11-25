import { useEffect } from 'react';
import { CheckCircle, CreditCard } from 'lucide-react';

const SuccessModal = ({ isOpen, title, message, amount, onClose, duration = 3000, saleType = 'contado' }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  // Configuración de colores según tipo de venta
  const isCredit = saleType === 'credito';
  const colors = isCredit ? {
    bg: 'from-orange-400 to-orange-600',
    bgLight: 'from-orange-50 to-orange-100',
    bgPulse: 'bg-orange-100',
    progress: 'from-orange-400 to-orange-600',
    text: 'text-orange-600'
  } : {
    bg: 'from-green-400 to-green-600',
    bgLight: 'from-blue-50 to-blue-100',
    bgPulse: 'bg-green-100',
    progress: 'from-green-400 to-green-600',
    text: 'text-primary'
  };

  const defaultTitle = isCredit ? '¡Venta Fiada Registrada!' : '¡Venta Completada!';
  const defaultMessage = isCredit ? 'VENTA EN MÉTODO DE DEUDA COMPLETADA' : 'La venta se ha registrado exitosamente';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-success-bounce">
        <div className="p-8 text-center">
          {/* Icono animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Círculo de fondo con pulso */}
              <div className={`absolute inset-0 ${colors.bgPulse} rounded-full animate-ping opacity-75`}></div>
              {/* Círculo principal */}
              <div className={`relative bg-gradient-to-br ${colors.bg} rounded-full p-6 shadow-lg`}>
                {isCredit ? (
                  <CreditCard className="text-white animate-check-draw" size={64} strokeWidth={3} />
                ) : (
                  <CheckCircle className="text-white animate-check-draw" size={64} strokeWidth={3} />
                )}
              </div>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-3xl font-bold text-gray-800 mb-3 animate-slide-up">
            {title || defaultTitle}
          </h2>

          {/* Mensaje */}
          <p className={`${isCredit ? 'text-orange-600 font-bold text-lg' : 'text-gray-600'} mb-4 animate-slide-up`} style={{ animationDelay: '0.1s' }}>
            {message || defaultMessage}
          </p>

          {/* Monto (si existe) */}
          {amount && (
            <div className={`bg-gradient-to-r ${colors.bgLight} rounded-xl p-4 mb-6 animate-slide-up`} style={{ animationDelay: '0.2s' }}>
              <p className="text-sm text-gray-600 mb-1">Total de la venta</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                ${amount.toLocaleString()}
              </p>
            </div>
          )}

          {/* Indicador de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${colors.progress} h-full animate-progress`}
              style={{ animationDuration: `${duration}ms` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;