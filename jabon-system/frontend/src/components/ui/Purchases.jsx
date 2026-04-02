import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, ChevronLeft, ChevronRight, X, Eye,
  FileText, Calendar, User, Hash, Package, DollarSign,
  Upload, Trash2, ImageIcon, Download, Loader2, AlertCircle
} from 'lucide-react';
import { getPurchases, getPurchase, createPurchase, getFileUrl } from '../../services/api';
import Portal from './Portal';

// Helper: formatear fecha Colombia
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    // Recibimos fechas en formato ISO Colombia: YYYY-MM-DDTHH:MM:SS
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

// Formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const Purchases = () => {
  // Vista actual: 'list' | 'create'
  const [view, setView] = useState('list');

  // Estado del listado
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });

  // Estado del detalle (modal)
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    numero_factura: '',
    proveedor: '',
    notas: ''
  });
  const [items, setItems] = useState([{ nombre_insumo: '', cantidad: '', precio_unitario: '' }]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar borrador al abrir el formulario
  useEffect(() => {
    if (view === 'create') {
      const savedForm = localStorage.getItem('purchaseDraftForm');
      const savedItems = localStorage.getItem('purchaseDraftItems');
      if (savedForm) setFormData(JSON.parse(savedForm));
      if (savedItems) setItems(JSON.parse(savedItems));
    }
  }, [view]);

  // Guardar borrador automáticamente al cambiar datos
  useEffect(() => {
    if (view === 'create') {
      localStorage.setItem('purchaseDraftForm', JSON.stringify(formData));
      localStorage.setItem('purchaseDraftItems', JSON.stringify(items));
    }
  }, [formData, items, view]);

  // Limpiar borrador explícito
  const clearDraft = useCallback(() => {
    localStorage.removeItem('purchaseDraftForm');
    localStorage.removeItem('purchaseDraftItems');
    setFormData({ numero_factura: '', proveedor: '', notas: '' });
    setItems([{ nombre_insumo: '', cantidad: '', precio_unitario: '' }]);
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
  }, []);

  // Cargar compras
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPurchases({ page, limit: 20, search });
      setPurchases(res.data.data || []);
      setPagination(res.data.pagination || { totalPages: 1, totalRecords: 0 });
    } catch (err) {
      console.error('Error cargando compras:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (view === 'list') {
      fetchPurchases();
    }
  }, [view, fetchPurchases]);

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Ver detalle
  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await getPurchase(id);
      setSelectedPurchase(res.data.data);
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Gestión de ítems del formulario
  const addItem = () => {
    setItems([...items, { nombre_insumo: '', cantidad: '', precio_unitario: '' }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Calcular total
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.cantidad) || 0;
      const price = parseFloat(item.precio_unitario) || 0;
      return sum + (qty * price);
    }, 0);
  };

  // Manejar imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, imagen: 'La imagen no debe exceder 10MB' }));
      return;
    }

    setImageFile(file);
    setFormErrors(prev => ({ ...prev, imagen: '' }));

    // Preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      // PDF u otro
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formData.numero_factura.trim()) errors.numero_factura = 'Número de factura obligatorio';
    if (!formData.proveedor.trim()) errors.proveedor = 'Proveedor obligatorio';
    if (!imageFile) errors.imagen = 'La imagen de la factura es obligatoria';

    // Validar items
    let hasItemError = false;
    items.forEach((item, i) => {
      if (!item.nombre_insumo.trim()) {
        errors[`item_${i}_nombre`] = 'Nombre requerido';
        hasItemError = true;
      }
      if (!item.cantidad || parseFloat(item.cantidad) <= 0) {
        errors[`item_${i}_cantidad`] = 'Cantidad inválida';
        hasItemError = true;
      }
      if (!item.precio_unitario || parseFloat(item.precio_unitario) <= 0) {
        errors[`item_${i}_precio`] = 'Precio inválido';
        hasItemError = true;
      }
    });

    if (hasItemError) errors.items = 'Revise los ítems marcados';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const data = new FormData();
      data.append('numero_factura', formData.numero_factura.trim());
      data.append('proveedor', formData.proveedor.trim());
      data.append('notas', formData.notas || '');
      data.append('items', JSON.stringify(items.map(item => ({
        nombre_insumo: item.nombre_insumo.trim(),
        cantidad: parseFloat(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario)
      }))));
      data.append('imagen', imageFile);

      await createPurchase(data);

      setSuccessMessage('¡Compra registrada exitosamente!');

      // Limpiar borrador tras envío exitoso
      clearDraft();

      // Volver al listado después de 2 segundos
      setTimeout(() => {
        setSuccessMessage('');
        setView('list');
      }, 2000);

    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrar la compra';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form al cambiar a crear nuevo o listar
  const handleCancelCreate = () => {
    setView('list');
  };

  const goToCreate = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setView('create');
  };

  // ========== RENDER: LISTADO ==========
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Registro de Compras</h1>
            <p className="text-gray-500 text-sm mt-1">
              {pagination.totalRecords} compra{pagination.totalRecords !== 1 ? 's' : ''} registrada{pagination.totalRecords !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={goToCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Nueva Compra</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por número de factura o proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Tabla / Lista */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="ml-3 text-gray-500">Cargando compras...</span>
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={48} className="mb-3" />
              <p className="text-lg font-medium">No hay compras registradas</p>
              <p className="text-sm">Registra tu primera compra haciendo clic en "Nueva Compra"</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nº Factura</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases.map((compra) => (
                      <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-primary">#{compra.numero_factura}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(compra.fecha)}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{compra.proveedor}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatCurrency(compra.total)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDetail(compra.id)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {purchases.map((compra) => (
                  <div
                    key={compra.id}
                    onClick={() => handleViewDetail(compra.id)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-primary text-lg">#{compra.numero_factura}</span>
                      <span className="font-bold text-gray-800">{formatCurrency(compra.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User size={14} />
                      <span>{compra.proveedor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={14} />
                      <span>{formatDate(compra.fecha)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={page >= pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de Detalle */}
        {showDetail && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetail(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Close */}
                <button
                  onClick={() => setShowDetail(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                  <X size={20} />
                </button>

                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : selectedPurchase ? (
                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary bg-opacity-10">
                          <FileText className="text-primary" size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">Factura #{selectedPurchase.numero_factura}</h2>
                          <p className="text-sm text-gray-500">{formatDate(selectedPurchase.fecha)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Info general */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="text-gray-400" size={20} />
                        <div>
                          <p className="text-xs text-gray-400">Proveedor</p>
                          <p className="font-semibold text-gray-800">{selectedPurchase.proveedor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <DollarSign className="text-green-500" size={20} />
                        <div>
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="font-bold text-green-600 text-lg">{formatCurrency(selectedPurchase.total)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ítems */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Ítems de la compra</h3>
                      
                      {/* Desktop Table */}
                      <div className="hidden sm:block bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left px-4 py-3 font-medium text-gray-500">Insumo</th>
                              <th className="text-center px-4 py-3 font-medium text-gray-500">Cant.</th>
                              <th className="text-right px-4 py-3 font-medium text-gray-500">P. Unit.</th>
                              <th className="text-right px-4 py-3 font-medium text-gray-500">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedPurchase.detalles?.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 text-gray-800 font-medium">{item.nombre_insumo}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{item.cantidad}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.precio_unitario)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100 border-t border-gray-200">
                              <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">TOTAL</td>
                              <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">{formatCurrency(selectedPurchase.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="sm:hidden border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="divide-y divide-gray-100">
                          {selectedPurchase.detalles?.map((item) => (
                            <div key={item.id} className="p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-gray-800 line-clamp-2 pr-2">{item.nombre_insumo}</span>
                                <span className="font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{item.cantidad} unds</span>
                                <span>{formatCurrency(item.precio_unitario)} c/u</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-bold text-gray-700 text-sm">TOTAL</span>
                          <span className="font-bold text-green-600 text-lg">{formatCurrency(selectedPurchase.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    {selectedPurchase.notas && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notas / Observaciones</h3>
                        <p className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700 border border-yellow-200">
                          {selectedPurchase.notas}
                        </p>
                      </div>
                    )}

                    {/* Imagen */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Imagen de la factura</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {selectedPurchase.imagen_url?.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center py-8 bg-gray-50">
                            <FileText size={48} className="text-red-400 mb-3" />
                            <p className="text-sm text-gray-500 mb-3">Documento PDF</p>
                            <a
                              href={getFileUrl(selectedPurchase.imagen_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary flex items-center gap-2 text-sm"
                            >
                              <Download size={16} />
                              Ver / Descargar PDF
                            </a>
                          </div>
                        ) : (
                          <div>
                            <img
                              src={getFileUrl(selectedPurchase.imagen_url)}
                              alt={`Factura ${selectedPurchase.numero_factura}`}
                              className="w-full h-auto max-h-96 object-contain bg-gray-100"
                            />
                            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                              <a
                                href={getFileUrl(selectedPurchase.imagen_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <Download size={14} />
                                Abrir imagen completa
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fecha de registro */}
                    <div className="text-xs text-gray-400 text-center mt-4 pb-2">
                      Registrado el: {formatDate(selectedPurchase.created_at)}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 text-gray-400">
                    <p>No se pudo cargar la información</p>
                  </div>
                )}
              </div>
            </div>
          </Portal>
        )}
      </div>
    );
  }

  // ========== RENDER: FORMULARIO DE CREACIÓN ==========
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancelCreate}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nueva Compra</h1>
            <p className="text-gray-500 text-sm">Registrar factura de compra de insumos</p>
          </div>
        </div>
        
        {/* Botón limpiar borrador */}
        <button
          onClick={clearDraft}
          className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
          title="Borrar todos los datos actuales e iniciar uno nuevo"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Limpiar formulario</span>
        </button>
      </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-scale-in">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <span className="font-medium text-green-700">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-scale-in">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <span className="text-red-700">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-red-400 hover:text-red-600">
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos generales */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Hash size={20} className="text-primary" />
            Datos de la factura
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de factura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.numero_factura}
                onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                className={`input-field ${formErrors.numero_factura ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                placeholder="Ej: FAC-001"
              />
              {formErrors.numero_factura && (
                <p className="text-red-500 text-xs mt-1">{formErrors.numero_factura}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                className={`input-field ${formErrors.proveedor ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                placeholder="Nombre del proveedor"
              />
              {formErrors.proveedor && (
                <p className="text-red-500 text-xs mt-1">{formErrors.proveedor}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas / Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Observaciones o notas adicionales..."
            />
          </div>
        </div>

        {/* Ítems */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Ítems de la compra
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              <Plus size={16} />
              Agregar ítem
            </button>
          </div>

          {formErrors.items && (
            <p className="text-red-500 text-sm">{formErrors.items}</p>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg"
              >
                {/* Nombre */}
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-xs text-gray-500 mb-1">Insumo / Materia prima</label>
                  <input
                    type="text"
                    value={item.nombre_insumo}
                    onChange={(e) => updateItem(index, 'nombre_insumo', e.target.value)}
                    className={`input-field text-sm ${formErrors[`item_${index}_nombre`] ? 'border-red-400' : ''}`}
                    placeholder="Nombre del insumo"
                  />
                </div>
                {/* Cantidad */}
                <div className="col-span-5 sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                    className={`input-field text-sm ${formErrors[`item_${index}_cantidad`] ? 'border-red-400' : ''}`}
                    placeholder="0"
                    min="0"
                    step="any"
                  />
                </div>
                {/* Precio */}
                <div className="col-span-5 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Precio unitario</label>
                  <input
                    type="number"
                    value={item.precio_unitario}
                    onChange={(e) => updateItem(index, 'precio_unitario', e.target.value)}
                    className={`input-field text-sm ${formErrors[`item_${index}_precio`] ? 'border-red-400' : ''}`}
                    placeholder="$0"
                    min="0"
                    step="any"
                  />
                </div>
                {/* Subtotal + eliminar */}
                <div className="col-span-2 sm:col-span-2 flex flex-col items-end">
                  <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                  <p className="text-sm font-semibold text-gray-700 py-2">
                    {formatCurrency((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0))}
                  </p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-600 mt-1"
                      title="Eliminar ítem"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total de la compra</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotal())}</p>
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" />
            Imagen de la factura <span className="text-red-500">*</span>
          </h2>

          {formErrors.imagen && (
            <p className="text-red-500 text-sm">{formErrors.imagen}</p>
          )}

          {!imageFile ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 text-yellow-800 text-sm p-4 rounded-xl border border-yellow-200 flex gap-3 items-start shadow-sm">
                <AlertCircle className="flex-shrink-0 mt-0.5 text-yellow-500" size={20} />
                <div className="space-y-1">
                  <p className="font-semibold text-yellow-900">¿Estás registrando desde un celular?</p>
                  <p className="text-yellow-800/90 leading-relaxed">
                    <strong className="font-bold text-yellow-900">Toma la foto primero</strong> con la aplicación de tu cámara normal y luego usar este botón para "Elegir archivo" (desde la galería). 
                  </p>
                </div>
              </div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-10 px-6 cursor-pointer hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-all">
                <Upload size={40} className="text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">Toca para seleccionar archivo o tomar foto</p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP o PDF • Máximo 10MB</p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="relative border border-gray-200 rounded-xl overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-auto max-h-64 object-contain bg-gray-100"
                />
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50">
                  <FileText size={32} className="text-red-400" />
                  <div>
                    <p className="font-medium text-gray-700">{imageFile.name}</p>
                    <p className="text-xs text-gray-400">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={handleCancelCreate}
            className="btn-secondary order-2 sm:order-1"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Registrando...
              </>
            ) : (
              <>
                <FileText size={18} />
                Registrar Compra
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Purchases;
