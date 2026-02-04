import { useState, useEffect } from 'react';
import { X, Package, Droplet, Box, DollarSign, AlertCircle } from 'lucide-react';
import Portal from './Portal';

// Configuración de aromas por categoría de producto
const AROMAS_POR_CATEGORIA = {
  'ambientador': ['citronela', 'canela', 'lavanda', 'vainilla', 'coco', 'fresa'],
  'detergente': ['palmolive', 'floral', 'limón', 'coco', 'manzana'],
  'lava loza': ['limón', 'manzana', 'naranja', 'verde'],
  'desengrasante': ['industrial', 'cítrico', 'naranja'],
  'soflan': ['primavera', 'lavanda', 'bebé', 'floral'],
  'limpido': ['pino', 'lavanda', 'eucalipto', 'limón'],
  'jabon cosmetico': ['rosas', 'aloe vera', 'coco', 'avena'],
  'shampoo vehiculos': ['cereza', 'manzana', 'neutro', 'fresa']
};

const AddProductModal = ({ isOpen, onClose, onAddToCart, products }) => {
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedAroma, setSelectedAroma] = useState('');
  const [selectedPresentacion, setSelectedPresentacion] = useState('');
  const [productInfo, setProductInfo] = useState(null);

  // Obtener categorías únicas de los productos
  const categorias = [...new Set(products.map(p => p.aroma))].sort();

  // Obtener presentaciones únicas de los productos
  const presentaciones = [...new Set(products.map(p => p.presentacion))].sort();

  // Resetear selecciones cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoria('');
      setSelectedAroma('');
      setSelectedPresentacion('');
      setProductInfo(null);
    }
  }, [isOpen]);

  // Actualizar información del producto cuando cambian las selecciones
  useEffect(() => {
    if (selectedCategoria && selectedAroma && selectedPresentacion) {
      // Buscar el producto que coincida con la selección
      const product = products.find(
        p => p.nombre.toLowerCase() === selectedCategoria.toLowerCase() &&
             p.aroma.toLowerCase() === selectedAroma.toLowerCase() &&
             p.presentacion.toLowerCase() === selectedPresentacion.toLowerCase()
      );

      if (product) {
        setProductInfo(product);
      } else {
        setProductInfo(null);
      }
    } else {
      setProductInfo(null);
    }
  }, [selectedCategoria, selectedAroma, selectedPresentacion, products]);

  // Lista predefinida de productos permitidos
  const productNames = [
    'lava loza',
    'detergente',
    'desengrasante',
    'ambientador',
    'soflan',
    'limpido',
    'jabon cosmetico',
    'shampoo vehiculos'
  ];

  // Obtener aromas disponibles según la categoría seleccionada
  const getAromasDisponibles = () => {
    if (!selectedCategoria) return [];
    
    // Buscar productos que coincidan con la categoría seleccionada
    const productosDeCategoria = products.filter(
      p => p.nombre.toLowerCase() === selectedCategoria.toLowerCase()
    );
    
    // Obtener aromas únicos de esos productos
    return [...new Set(productosDeCategoria.map(p => p.aroma))].sort();
  };

  // Obtener presentaciones disponibles según categoría y aroma
  const getPresentacionesDisponibles = () => {
    if (!selectedCategoria || !selectedAroma) return [];
    
    const productosDisponibles = products.filter(
      p => p.nombre.toLowerCase() === selectedCategoria.toLowerCase() &&
           p.aroma.toLowerCase() === selectedAroma.toLowerCase()
    );
    
    return [...new Set(productosDisponibles.map(p => p.presentacion))].sort();
  };

  const handleAgregarAlCarrito = () => {
    if (productInfo && productInfo.stock > 0) {
      onAddToCart(productInfo);
      onClose();
    }
  };

  const aromasDisponibles = getAromasDisponibles();
  const presentacionesDisponibles = getPresentacionesDisponibles();

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <Package size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Agregar Producto</h2>
                  <p className="text-blue-100 text-sm mt-1">Selecciona el producto que deseas agregar al carrito</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Paso 1: Seleccionar Producto/Categoría */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Package size={18} className="text-blue-500" />
                1. Selecciona el Producto
              </label>
              <select
                value={selectedCategoria}
                onChange={(e) => {
                  setSelectedCategoria(e.target.value);
                  setSelectedAroma('');
                  setSelectedPresentacion('');
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all"
              >
                <option value="">-- Selecciona un producto --</option>
                {productNames.map((nombre) => (
                  <option key={nombre} value={nombre} className="capitalize">
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Paso 2: Seleccionar Aroma */}
            {selectedCategoria && (
              <div className="animate-fade-in">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Droplet size={18} className="text-purple-500" />
                  2. Selecciona el Aroma
                </label>
                <select
                  value={selectedAroma}
                  onChange={(e) => {
                    setSelectedAroma(e.target.value);
                    setSelectedPresentacion('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base transition-all"
                >
                  <option value="">-- Selecciona un aroma --</option>
                  {aromasDisponibles.map((aroma) => (
                    <option key={aroma} value={aroma} className="capitalize">
                      {aroma}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paso 3: Seleccionar Presentación */}
            {selectedCategoria && selectedAroma && (
              <div className="animate-fade-in">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Box size={18} className="text-green-500" />
                  3. Selecciona la Presentación
                </label>
                <select
                  value={selectedPresentacion}
                  onChange={(e) => setSelectedPresentacion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base transition-all"
                >
                  <option value="">-- Selecciona una presentación --</option>
                  {presentacionesDisponibles.map((presentacion) => (
                    <option key={presentacion} value={presentacion} className="capitalize">
                      {presentacion}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Información del Producto Seleccionado */}
            {productInfo && (
              <div className="animate-fade-in bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="text-green-600" size={24} />
                  Información del Producto
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Precio de Venta</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${productInfo.precio_venta.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Stock Disponible</p>
                    <p className={`text-2xl font-bold ${
                      productInfo.stock > 10 
                        ? 'text-green-600' 
                        : productInfo.stock > 0 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                    }`}>
                      {productInfo.stock} unidades
                    </p>
                  </div>
                </div>

                {/* Advertencia de stock bajo */}
                {productInfo.stock < 1 && (
                  <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Sin Stock Disponible</p>
                      <p className="text-xs text-red-600 mt-1">
                        Este producto no tiene unidades disponibles en inventario
                      </p>
                    </div>
                  </div>
                )}

                {productInfo.stock > 0 && productInfo.stock <= 10 && (
                  <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Stock Bajo</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Quedan pocas unidades disponibles
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje cuando no hay coincidencias */}
            {selectedCategoria && selectedAroma && selectedPresentacion && !productInfo && (
              <div className="animate-fade-in bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Producto No Encontrado</h3>
                    <p className="text-sm text-red-600">
                      No existe un producto con la combinación seleccionada. Por favor, verifica tu selección o contacta al administrador.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl sticky bottom-0">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgregarAlCarrito}
              disabled={!productInfo || productInfo.stock < 1}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            >
              {productInfo && productInfo.stock < 1 ? 'Sin Stock' : 'Agregar al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AddProductModal;
