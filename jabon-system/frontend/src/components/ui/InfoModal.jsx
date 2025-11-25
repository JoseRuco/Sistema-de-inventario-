import { useEffect } from 'react';
import { CheckCircle, Package, Edit, UserCheck, AlertTriangle } from 'lucide-react';

const InfoModal = ({ 
  isOpen, 
  type = 'success', // 'success', 'update', 'edit', 'info', 'error'
  title, 
  message, 
  subtitle,
  onClose, 
  duration = 2500 
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const config = {
    success: {
      gradient: 'from-green-400 to-green-600',
      bg: 'bg-green-50',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    update: {
      gradient: 'from-blue-400 to-blue-600',
      bg: 'bg-blue-50',
      icon: Package,
      iconColor: 'text-blue-500'
    },
    edit: {
      gradient: 'from-purple-400 to-purple-600',
      bg: 'bg-purple-50',
      icon: Edit,
      iconColor: 'text-purple-500'
    },
    info: {
      gradient: 'from-cyan-400 to-cyan-600',
      bg: 'bg-cyan-50',
      icon: UserCheck,
      iconColor: 'text-cyan-500'
    },
    error: {
      gradient: 'from-red-400 to-red-600',
      bg: 'bg-red-50',
      icon: AlertTriangle,
      iconColor: 'text-red-500'
    }
  };

  const { gradient, bg, icon: Icon, iconColor } = config[type] || config.error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] animate-fade-in p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-success-bounce">
        <div className="p-8 text-center">
          {/* Icono animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={`absolute inset-0 ${bg} rounded-full animate-ping opacity-75`}></div>
              <div className={`relative bg-gradient-to-br ${gradient} rounded-full p-6 shadow-lg`}>
                <Icon className="text-white animate-check-draw" size={64} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-3xl font-bold text-gray-800 mb-3 animate-slide-up">
            {title}
          </h2>

          {/* Mensaje */}
          <p className="text-gray-600 mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {message}
          </p>

          {/* Subtítulo adicional */}
          {subtitle && (
            <p className="text-sm text-gray-500 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {subtitle}
            </p>
          )}

          {/* Indicador de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mt-6">
            <div 
              className={`bg-gradient-to-r ${gradient} h-full animate-progress`}
              style={{ animationDuration: `${duration}ms` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;