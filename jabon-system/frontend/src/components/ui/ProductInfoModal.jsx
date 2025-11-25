import { useEffect, useState } from 'react';
import { X, Package, DollarSign, TrendingUp, Calendar, ShoppingCart, AlertCircle } from 'lucide-react';
import { getProductStats } from '../../services/api';

const ProductInfoModal = ({ isOpen, product, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchProductStats();
    }
  }, [isOpen, product]);

  const fetchProductStats = async () => {
    try {
      setLoading(true);
      const response = await getProductStats(product.id);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching product stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const margen = product.precio_venta - product.precio_costo;
  const porcentajeMargen = ((margen / product.precio_costo) * 100).toFixed(1);

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Sin Stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (stock < 10) return { text: 'Stock Bajo', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Stock Bueno', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const stockStatus = getStockStatus(product.stock);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{product.nombre}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                {product.tipo}
              </span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                {product.presentacion}
              </span>
              <span className={`px-3 py-1 ${stockStatus.bg} ${stockStatus.color} rounded-full text-sm font-semibold`}>
                {stockStatus.text}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">ID</p>
              <p className="text-lg font-semibold text-gray-900">#{product.id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Stock Actual</p>
              <p className="text-lg font-semibold text-gray-900">{product.stock}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Precio Costo</p>
              <p className="text-lg font-semibold text-gray-900">${product.precio_costo.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Precio Venta</p>
              <p className="text-lg font-semibold text-gray-900">${product.precio_venta.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Ganancia por Unidad</p>
              <p className="text-lg font-semibold text-green-700">${margen.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Margen</p>
              <p className="text-lg font-semibold text-blue-700">{porcentajeMargen}%</p>
            </div>
          </div>

          {/* Estadísticas de Ventas */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : stats ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Ventas Este Mes */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Ventas Este Mes</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Unidades Vendidas</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.monthSales?.cantidad || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Ingresos</span>
                    <span className="text-xl font-semibold text-green-600">
                      ${(stats.monthSales?.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ventas Históricas */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Ventas Históricas</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Total Unidades</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {stats.totalSales?.cantidad || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Ingresos Totales</span>
                    <span className="text-xl font-semibold text-green-600">
                      ${(stats.totalSales?.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">No se pudieron cargar las estadísticas</p>
              </div>
            </div>
          )}

          {/* Mensaje si no hay ventas */}
          {stats && stats.totalSales && stats.totalSales.cantidad === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Package className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Este producto aún no ha sido vendido</p>
              </div>
            </div>
          )}

          {/* Fecha de Creación */}
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t">
            <Calendar className="w-4 h-4" />
            <span>
              Registrado el {new Date(product.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoModal;
