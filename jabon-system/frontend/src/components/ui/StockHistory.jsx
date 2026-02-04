import { useEffect, useState } from 'react';
import { Calendar, Package, Search, RefreshCw, Box, Layers } from 'lucide-react';
import { getManualStockUpdates } from '../../services/api';

const StockHistory = () => {
  const [allRows, setAllRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros locales (no disparan re-carga)
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    searchTerm: '',
    presentacion: ''
  });

  // Lista única de presentaciones para el filtro
  const [presentaciones, setPresentaciones] = useState([]);

  // Cargar datos solo una vez al montar
  useEffect(() => {
    loadHistory();
  }, []);

  // Aplicar filtros localmente (sin recargar del servidor)
  useEffect(() => {
    applyFilters();
  }, [allRows, filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getManualStockUpdates();
      const data = res.data || [];
      setAllRows(data);
      
      // Extraer presentaciones únicas
      const uniquePresentaciones = [...new Set(data.map(row => row.presentacion).filter(Boolean))];
      setPresentaciones(uniquePresentaciones);
    } catch (e) {
      console.error('❌ Error cargando historial de stock:', e);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...allRows];

    // Filtro por búsqueda de texto
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(row => 
        row.producto_nombre?.toLowerCase().includes(term) ||
        row.aroma?.toLowerCase().includes(term) ||
        row.presentacion?.toLowerCase().includes(term) ||
        row.motivo?.toLowerCase().includes(term)
      );
    }

    // Filtro por presentación
    if (filters.presentacion) {
      result = result.filter(row => row.presentacion === filters.presentacion);
    }

    // Filtro por rango de fechas
    if (filters.fecha_inicio && filters.fecha_fin) {
      const startDate = new Date(filters.fecha_inicio);
      const endDate = new Date(filters.fecha_fin);
      
      result = result.filter(row => {
        const rowDate = new Date(row.fecha);
        return rowDate >= startDate && rowDate <= endDate;
      });
    }

    setFilteredRows(result);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      searchTerm: '',
      presentacion: ''
    });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando historial de stock...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Package className="w-8 h-8" />
              </div>
              Historial de Stock
            </h2>
            <p className="text-indigo-100 mt-2">Registro de actualizaciones manuales de inventario</p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                <span>{filteredRows.length} registros</span>
              </div>
            </div>
          </div>
          <button
            onClick={loadHistory}
            className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Producto, aroma o motivo..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Presentación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presentación
            </label>
            <select
              value={filters.presentacion}
              onChange={(e) => handleFilterChange('presentacion', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas las presentaciones</option>
              {presentaciones.map((pres) => (
                <option key={pres} value={pres}>
                  {pres}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filters.fecha_inicio}
              onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filters.fecha_fin}
              onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold">Fecha</th>
                <th className="px-4 py-4 text-left text-sm font-semibold">Producto</th>
                <th className="px-4 py-4 text-left text-sm font-semibold">Presentación</th>
                <th className="px-4 py-4 text-left text-sm font-semibold">Aroma</th>
                <th className="px-4 py-4 text-center text-sm font-semibold">Cantidad</th>
                <th className="px-4 py-4 text-center text-sm font-semibold">Stock Anterior</th>
                <th className="px-4 py-4 text-center text-sm font-semibold">Stock Nuevo</th>
                <th className="px-4 py-4 text-left text-sm font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">
                        No hay registros
                      </h3>
                      <p className="text-gray-500">
                        {allRows.length === 0 
                          ? 'No hay actualizaciones de stock registradas'
                          : 'No se encontraron resultados con los filtros aplicados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50 transition-colors">
                    {/* FECHA con ícono */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium">{formatDate(row.fecha)}</span>
                      </div>
                    </td>

                    {/* Producto */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800">
                          {row.producto_nombre || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Presentación con ícono */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          {row.presentacion || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Aroma con ícono */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">
                          {row.aroma || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        row.cantidad > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row.cantidad > 0 ? '+' : ''}{row.cantidad}
                      </span>
                    </td>

                    {/* Stock Anterior */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-medium text-gray-700">
                        {row.stock_anterior ?? '-'}
                      </span>
                    </td>

                    {/* Stock Nuevo */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-indigo-600">
                        {row.stock_nuevo ?? '-'}
                      </span>
                    </td>

                    {/* Motivo */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {row.motivo || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer con estadísticas */}
      {filteredRows.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-800">{filteredRows.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockHistory;
