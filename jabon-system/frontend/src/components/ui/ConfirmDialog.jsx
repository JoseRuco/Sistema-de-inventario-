import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import Portal from './Portal';

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
      : 'from-red-500 to-red-500';

  const iconBg = isDanger
    ? 'bg-red-100 text-red-600'
    : isWarning
      ? 'bg-yellow-100 text-yellow-600'
      : 'bg-red-100 text-red-600';

  const Icon = isDanger || isWarning ? AlertTriangle : CheckCircle;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in-bounce relative">
          
          {/* Header */}
          <div className={`bg-gradient-to-r ${headerColors} text-white p-6 flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white bg-opacity-20 shadow-inner`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mensaje */}
          <div className="p-8 text-center">
             <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${iconBg}`}>
                <Icon className="w-8 h-8" />
             </div>
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Botones */}
          <div className="bg-gray-50 px-6 py-5 flex gap-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium text-base shadow-sm"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-white font-medium text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 ${
                isDanger
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : isWarning
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-red-600 hover:to-red-700'
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
