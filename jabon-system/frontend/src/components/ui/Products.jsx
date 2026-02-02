import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, Info } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/api';
import InfoModal from './InfoModal';
import ConfirmDialog from './ConfirmDialog';
import ProductInfoModal from './ProductInfoModal';
import Portal from './Portal';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, productId: null, productName: '' });
  const [infoModal, setInfoModal] = useState({ isOpen: false, type: '', title: '', message: '', details: '' });
  const [stockModal, setStockModal] = useState({ isOpen: false, product: null, quantity: '' });

  // ✅ NUEVO: Estado para ProductInfoModal
  const [productInfoModal, setProductInfoModal] = useState({ isOpen: false, product: null });

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'loza',
    presentacion: 'galon',
    precio_costo: '',
    precio_venta: '',
    stock: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        setInfoModal({
          isOpen: true,
          type: 'edit',
          title: 'Producto Actualizado',
          message: 'Los datos del producto se han actualizado correctamente',
          details: `Producto: ${formData.nombre}`
        });
      } else {
        await createProduct(formData);
        setInfoModal({
          isOpen: true,
          type: 'success',
          title: 'Producto Creado',
          message: 'El producto se ha registrado exitosamente en el inventario',
          details: `Producto: ${formData.nombre} | Stock inicial: ${formData.stock}`
        });
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        nombre: '',
        tipo: 'loza',
        presentacion: 'galon',
        precio_costo: '',
        precio_venta: '',
        stock: ''
      });
      loadProducts();
    } catch (error) {
      console.error('Error guardando producto:', error);
      setInfoModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Guardar',
        message: 'No se pudo guardar el producto',
        details: error.response?.data?.error || 'Ocurrió un error inesperado'
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      tipo: product.tipo,
      presentacion: product.presentacion,
      precio_costo: product.precio_costo,
      precio_venta: product.precio_venta,
      stock: product.stock
    });
    setShowForm(true);
  };

  const handleDelete = (product) => {
    setConfirmDialog({
      isOpen: true,
      productId: product.id,
      productName: product.nombre
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct(confirmDialog.productId);
      setConfirmDialog({ isOpen: false, productId: null, productName: '' });

      setInfoModal({
        isOpen: true,
        type: 'success',
        title: 'Producto Desactivado',
        message: 'El producto ha sido desactivado exitosamente',
        details: ''
      });

      loadProducts();
    } catch (error) {
      setConfirmDialog({ isOpen: false, productId: null, productName: '' });

      if (error.response?.data?.error === 'No se puede eliminar') {
        setInfoModal({
          isOpen: true,
          type: 'error',
          title: error.response.data.message || 'No se puede eliminar',
          message: error.response.data.details || 'Este producto tiene ventas registradas',
          details: 'No es posible eliminarlo para mantener la integridad del historial.'
        });
      } else {
        setInfoModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Eliminar',
          message: 'No se pudo eliminar el producto',
          details: error.response?.data?.error || 'Ocurrió un error inesperado'
        });
      }
    }
  };

  const handleOpenStockModal = (product) => {
    setStockModal({
      isOpen: true,
      product: product,
      quantity: ''
    });
  };

  const handleStockChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setStockModal(prev => ({ ...prev, quantity: value }));
    }
  };

  const handleStockSubmit = async () => {
    const quantity = parseInt(stockModal.quantity);

    if (!quantity || quantity <= 0) {
      setInfoModal({
        isOpen: true,
        type: 'warning',
        title: 'Cantidad Inválida',
        message: 'Por favor ingresa una cantidad válida mayor a 0',
        details: ''
      });
      return;
    }

    try {
      const newStock = stockModal.product.stock + quantity;
      await updateProduct(stockModal.product.id, {
        stock: newStock
      });

      setStockModal({ isOpen: false, product: null, quantity: '' });

      setInfoModal({
        isOpen: true,
        type: 'success',
        title: 'Stock Actualizado',
        message: `Se agregaron ${quantity} unidades al inventario`,
        details: `Stock anterior: ${stockModal.product.stock} → Nuevo stock: ${newStock}`
      });

      loadProducts();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      setStockModal({ isOpen: false, product: null, quantity: '' });

      setInfoModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Actualizar Stock',
        message: 'No se pudo actualizar el inventario',
        details: error.response?.data?.error || 'Ocurrió un error inesperado'
      });
    }
  };

  // ✅ NUEVA FUNCIÓN: Abrir modal de información
  const handleShowProductInfo = (product) => {
    setProductInfoModal({
      isOpen: true,
      product: product
    });
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Package className="w-8 h-8" />
              </div>
              Inventario
            </h2>
            <p className="text-purple-100 mt-2">Gestión de productos y stock del sistema</p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                <span>{filteredProducts.length} productos registrados</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingProduct(null);
              setFormData({
                nombre: '',
                tipo: 'loza',
                presentacion: 'galon',
                precio_costo: '',
                precio_venta: '',
                stock: ''
              });
            }}
            className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder='Nombre'
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="loza">Loza</option>
                      <option value="detergente">Detergente</option>
                      <option value="desengrasante">Desengrasante</option>
                      <option value="ambientador">Ambientador</option>
                      <option value="soflan">Soflan</option>
                      <option value="limpido">Limpido</option> 
                      <option value="jabon cosmetico">Jabon Cosmetico</option>
                      <option value="shampoo vehiculos">Shampoo Vehiculos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presentación
                    </label>
                    <select
                      value={formData.presentacion}
                      onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="galon">Galón</option>
                      <option value="medio galon">Medio Galón</option>
                      <option value="litro">Litro</option>
                      <option value="poma">Poma</option>
                      <option value="litro">Spray 100ml</option>
                      <option value="litro">Spray 500ml</option>
                      
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Costo
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.precio_costo}
                      onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder='0.0'
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Venta
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.precio_venta}
                      onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder='0.0'
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder='0'
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {editingProduct ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Presentación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P. Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P. Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{product.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {product.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {product.presentacion.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.precio_costo.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.precio_venta.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.stock < 10
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenStockModal(product)}
                      className="text-green-600 hover:text-green-900 mr-3 transition-colors"
                      title="Ajustar Stock"
                    >
                      <Package size={18} />
                    </button>
                    {/* ✅ NUEVO BOTÓN: Información del Producto */}
                    <button
                      onClick={() => handleShowProductInfo(product)}
                      className="text-purple-600 hover:text-purple-900 mr-3 transition-colors"
                      title="Ver Información"
                    >
                      <Info size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar "${confirmDialog.productName}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, productId: null, productName: '' })}
      />

      <InfoModal
        isOpen={infoModal.isOpen}
        type={infoModal.type}
        title={infoModal.title}
        message={infoModal.message}
        details={infoModal.details}
        onClose={() => setInfoModal({ isOpen: false, type: '', title: '', message: '', details: '' })}
      />

      {/* ✅ NUEVO: ProductInfoModal */}
      <ProductInfoModal
        isOpen={productInfoModal.isOpen}
        product={productInfoModal.product}
        onClose={() => setProductInfoModal({ isOpen: false, product: null })}
      />

      {/* Modal de Ajuste de Stock */}
      {stockModal.isOpen && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <Package size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Ajustar Stock</h2>
                  <p className="text-green-100 text-sm mt-1">Agregar inventario</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white">
              {/* Información del Producto */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{stockModal.product?.nombre}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tipo:</p>
                    <p className="font-medium text-gray-900 capitalize">{stockModal.product?.tipo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Presentación:</p>
                    <p className="font-medium text-gray-900 capitalize">{stockModal.product?.presentacion?.replace('_', ' ')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Stock Actual:</p>
                    <p className="text-2xl font-bold text-blue-600">{stockModal.product?.stock} unidades</p>
                  </div>
                </div>
              </div>

              {/* Input de Cantidad */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Agregar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockModal.quantity}
                  onChange={handleStockChange}
                  placeholder="Ej: 50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  Ingresa la cantidad de unidades que deseas agregar al inventario
                </p>
              </div>

              {/* Vista Previa del Resultado */}
              {stockModal.quantity && parseInt(stockModal.quantity) > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Nuevo Stock:</p>
                      <p className="text-3xl font-bold text-green-600">
                        {stockModal.product?.stock + parseInt(stockModal.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Se agregarán:</p>
                      <p className="text-2xl font-bold text-green-600">+{stockModal.quantity}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setStockModal({ isOpen: false, product: null, quantity: '' })}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleStockSubmit}
                disabled={!stockModal.quantity || parseInt(stockModal.quantity) <= 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}

export default Products;
