import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import Portal from './Portal' ;

const ConfirmDialog = ({
  isOpen,
  type = 'info',
  title = 'Confirmación',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  const headerColors = isDanger
    ? 'from-red-500 to-red-600'
    : isWarning
    ? 'from-yellow-500 to-amber-600'
    : 'from-blue-500 to-indigo-600';

  const iconBg = isDanger
    ? 'bg-red-100 text-red-600'
    : isWarning
    ? 'bg-yellow-100 text-yellow-600'
    : 'bg-blue-100 text-blue-600';

  const Icon = isDanger || isWarning ? AlertTriangle : CheckCircle;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          
          {/* Header */}
          <div className={`bg-gradient-to-r ${headerColors} text-white p-5 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensaje */}
          <div className="p-5">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Botones */}
          <div className="bg-gray-50 px-5 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all ${
                isDanger
                  ? 'bg-red-500 hover:bg-red-600'
                  : isWarning
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {confirmText}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};

export default ConfirmDialog;
