import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Wallet,
  DollarSign,
  X,
  User,
  Search,
  Info,
} from "lucide-react";
import {
  getProducts,
  getClients,
  createSale,
  createClient,
  getClientDebt,
} from "../../services/api";
import Notification from "./Notification";
import SuccessModal from "./SuccessModal";
import ClientFormModal from "./ClientFormModal";
import SaleConfirmationModal from "./SaleConfirmationModal";
import ProductInfoModal from './ProductInfoModal';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    amount: 0,
    saleType: "contado",
  });

  // Estados para animaciones y confirmación
  const [animatingProduct, setAnimatingProduct] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [clientDebt, setClientDebt] = useState(0);

  // Estado para búsqueda de productos
  const [productSearch, setProductSearch] = useState("");

  // Estados para búsqueda de cliente
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
  });

  // Estados para sistema de crédito
  const [paymentType, setPaymentType] = useState("contado");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [partialPayment, setPartialPayment] = useState("");

  // Estado para descuento ocasional
  const [occasionalDiscount, setOccasionalDiscount] = useState("");

  // Estado para nota de venta
  const [saleNote, setSaleNote] = useState("");

  // Estado para modal de información del producto
  const [productInfoModal, setProductInfoModal] = useState({ isOpen: false, product: null });

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showClientSuggestions &&
        !event.target.closest(".client-search-container")
      ) {
        setShowClientSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showClientSuggestions]);

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
  };

  const loadData = async () => {
    try {
      const [productsRes, clientsRes] = await Promise.all([
        getProducts(),
        getClients(),
      ]);
      setProducts(productsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      showNotification("error", "Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.producto_id === product.id);

    if (existingItem) {
      if (existingItem.cantidad >= product.stock) {
        showNotification(
          "warning",
          "Stock Insuficiente",
          "No hay más unidades disponibles",
        );
        return;
      }
      setCart(
        cart.map((item) =>
          item.producto_id === product.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * product.precio_venta,
              }
            : item,
        ),
      );
    } else {
      if (product.stock < 1) {
        showNotification(
          "warning",
          "Sin Stock",
          "Este producto no tiene stock disponible",
        );
        return;
      }
      setCart([
        ...cart,
        {
          producto_id: product.id,
          nombre: product.nombre,
          tipo: product.tipo,
          presentacion: product.presentacion,
          precio_unitario: product.precio_venta,
          cantidad: 1,
          subtotal: product.precio_venta,
          stock_disponible: product.stock,
        },
      ]);
    }

    // Animación y sonido
    setAnimatingProduct(product.id);
    setTimeout(() => setAnimatingProduct(null), 600);

    // Reproducir sonido de confirmación
    playAddToCartSound();
  };

  const playAddToCartSound = () => {
    try {
      // Crear un sonido simple usando Web Audio API
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  const updateQuantity = (producto_id, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cart.find((i) => i.producto_id === producto_id);
    if (newQuantity > item.stock_disponible) {
      showNotification(
        "warning",
        "Stock Insuficiente",
        "No hay suficiente stock disponible",
      );
      return;
    }

    setCart(
      cart.map((item) =>
        item.producto_id === producto_id
          ? {
              ...item,
              cantidad: newQuantity,
              subtotal: newQuantity * item.precio_unitario,
            }
          : item,
      ),
    );
  };

  const removeFromCart = (producto_id) => {
    setCart(cart.filter((item) => item.producto_id !== producto_id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = parseFloat(occasionalDiscount) || 0;
    return Math.max(0, subtotal - discount);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      showNotification(
        "warning",
        "Carrito Vacío",
        "Debe agregar al menos un producto",
      );
      return;
    }

    if (!selectedClient || selectedClient === "") {
      showNotification(
        "warning",
        "Cliente Requerido",
        "Debe seleccionar un cliente",
      );
      return;
    }

    // ✅ Validar que no se hagan ventas fiadas al Cliente General
    if (parseInt(selectedClient) === 1 && paymentType === "credito") {
      showNotification(
        "warning",
        "Venta No Permitida",
        "No se pueden registrar ventas fiadas para el Cliente General. Use ventas al contado o cree un cliente específico.",
      );
      setPaymentType("contado");
      setPartialPayment("");
      return;
    }

    const subtotal = getSubtotal();
    const discount = parseFloat(occasionalDiscount) || 0;

    if (discount > subtotal) {
      showNotification(
        "warning",
        "Descuento Inválido",
        "El descuento no puede ser mayor al total de la compra",
      );
      return;
    }

    const totalAmount = calculateTotal();

    if (paymentType === "credito") {
      const abono = parseFloat(partialPayment) || 0;
      if (abono < 0 || abono > totalAmount) {
        showNotification(
          "warning",
          "Abono Inválido",
          "El abono debe ser entre 0 y el total",
        );
        return;
      }
    }

    // Mostrar modal de confirmación
    setShowConfirmationModal(true);
  };

  const handleConfirmSale = async () => {
    const totalAmount = calculateTotal();

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const fechaVenta = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const saleData = {
      cliente_id: parseInt(selectedClient),
      fecha: fechaVenta,
      productos: cart,
      metodo_pago: paymentMethod,
      descuento: parseFloat(occasionalDiscount) || 0,
      notas: saleNote,
    };

    if (paymentType === "credito") {
      const abono = parseFloat(partialPayment) || 0;

      // Determine payment status based on amount paid
      if (abono === 0) {
        saleData.estado_pago = "pendiente";
      } else if (abono >= totalAmount) {
        saleData.estado_pago = "pagado";
      } else {
        saleData.estado_pago = "parcial";
      }

      saleData.monto_pagado = abono;
      saleData.monto_pendiente = Math.max(0, totalAmount - abono);
    } else {
      saleData.estado_pago = "pagado";
      saleData.monto_pagado = totalAmount;
      saleData.monto_pendiente = 0;
    }

    try {
      await createSale(saleData);
      setShowConfirmationModal(false);
      setSuccessModal({
        isOpen: true,
        amount: totalAmount,
        saleType: paymentType,
      });

      setCart([]);
      setSelectedClient("");
      setClientSearch("");
      setPaymentType("contado");
      setPaymentMethod("efectivo");
      setPartialPayment("");
      setOccasionalDiscount("");
      setSaleNote("");

      loadData();
    } catch (error) {
      console.error("Error registrando venta:", error);
      setShowConfirmationModal(false);
      showNotification(
        "error",
        "Error",
        error.response?.data?.error || "Error al registrar la venta",
      );
    }
  };

  // Filtrar productos basado en búsqueda
  const filteredProducts = products
    .filter(
      (product) =>
        product.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.tipo.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.presentacion.toLowerCase().includes(productSearch.toLowerCase()),
    )
    // Ordenar por categoría primero, luego por nombre
    .sort((a, b) => {
      // Primero ordenar por tipo/categoría
      const categoryComparison = a.tipo.localeCompare(b.tipo);
      if (categoryComparison !== 0) return categoryComparison;
      
      // Si son de la misma categoría, ordenar por nombre
      return a.nombre.localeCompare(b.nombre);
    });


  // Filtrar clientes basado en búsqueda
  const filteredClients = clients.filter((client) =>
    client.nombre.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  // Manejar selección de cliente
  const handleSelectClient = async (client) => {
    setSelectedClient(client.id);
    setClientSearch(client.nombre);
    setShowClientSuggestions(false);

    // Consultar deuda del cliente
    try {
      const response = await getClientDebt(client.id);
      if (response.data && response.data.success) {
        setClientDebt(response.data.data.totalDebt || 0);
      } else {
        setClientDebt(0);
      }
    } catch (error) {
      console.error("Error al obtener deuda:", error);
      setClientDebt(0);
    }
  };

  // Manejar creación de nuevo cliente
  const handleCreateNewClient = () => {
    setClientFormData({
      nombre: clientSearch,
      telefono: "",
      correo: "",
      direccion: "",
    });
    setShowClientModal(true);
    setShowClientSuggestions(false);
  };

  // Manejar envío de formulario de cliente
  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createClient(clientFormData);
      await loadData();

      const newClient = response.data;
      setSelectedClient(newClient.id);
      setClientSearch(newClient.nombre);
      setShowClientModal(false);

      showNotification(
        "success",
        "Cliente Creado",
        `${newClient.nombre} se agregó exitosamente`,
      );
    } catch (error) {
      console.error("Error creando cliente:", error);
      showNotification(
        "error",
        "Error",
        error.response?.data?.message || "No se pudo crear el cliente",
      );
    }
  };

  // Función para abrir el modal de información del producto
  const handleShowProductInfo = (product) => {
    setProductInfoModal({
      isOpen: true,
      product: product
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 h-screen flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 h-full overflow-hidden">
        {/* Panel de Productos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden ">
          <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Productos Disponibles</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            {/* Buscador de Productos */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar por nombre, categoría o presentación..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-all"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <Search size={48} className="mb-2" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Header de la tabla - solo en desktop */}
                <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-xs rounded-lg sticky top-0 z-10 shadow-md">
                  <div className="col-span-3">Producto</div>
                  <div className="col-span-2">Categoría</div>
                  <div className="col-span-2">Presentación</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-center">Stock</div>
                  <div className="col-span-1 text-center">Agregar</div>
                </div>

                {/* Lista de productos */}
                {filteredProducts.map((product, index) => {
                  // Determinar si este producto es el primero de una nueva categoría
                  const isFirstInCategory = index === 0 || filteredProducts[index - 1].tipo !== product.tipo;
                  
                  return (
                    <div key={product.id}>
                      {/* Separador de Categoría */}
                      {isFirstInCategory && (
                        <div className="sticky top-8 md:top-10 z-[9] mt-3 mb-2 first:mt-0">
                          <div className=" bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1  my-5 rounded-lg shadow-lg flex items-center gap-2">
                            <div className="w-1 h-6 bg-white rounded-full"></div>
                            <h3 className="font-bold text-sm md:text-base uppercase tracking-wide">
                              {product.tipo}
                            </h3>
                            <div className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                              {filteredProducts.filter(p => p.tipo === product.tipo).length} productos
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Producto */}
                      <div
                        className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 p-3 rounded-lg transition-all duration-200 border
                          ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                          hover:bg-blue-50 hover:shadow-md hover:border-blue-300 hover:scale-[1.01]
                          ${product.stock < 1 ? "opacity-60" : ""}
                        `}
                      >
                        {/* Producto - Mobile: título principal, Desktop: columna */}
                        <div className="md:col-span-3 flex items-center gap-2">
                          {/* Botón de Información */}
                          <button
                            onClick={() => handleShowProductInfo(product)}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 active:scale-95 transition-all"
                            title="Ver información del producto"
                          >
                            <Info size={16} />
                          </button>
                          
                          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 md:line-clamp-1">
                            {product.nombre}
                          </h3>
                        </div>

                        {/* Categoría */}
                        <div className="md:col-span-2 flex items-center">
                          <span className="text-xs text-gray-600 md:text-sm">
                            <span className="md:hidden font-medium text-gray-500">
                              Categoría:{" "}
                            </span>
                            {product.tipo}
                          </span>
                        </div>

                        {/* Presentación */}
                        <div className="md:col-span-2 flex items-center">
                          <span className="inline-flex items-center bg-blue-100 text-blue-800 ml-5 pl-2 pr-2 py-1 rounded-md text-xs font-medium">
                            {product.presentacion}
                          </span>
                        </div>

                        {/* Precio */}
                        <div className="md:col-span-2 flex items-center md:justify-end">
                          <span className="text-base md:text-lg font-bold text-green-600">
                            ${product.precio_venta.toLocaleString()}
                          </span>
                        </div>

                        {/* Stock */}
                        <div className="md:col-span-2 flex items-center md:justify-center">
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap inline-flex items-center gap-1 ${
                              product.stock > 10
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : product.stock > 0
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                            }`}
                          >
                            <span className="md:hidden">Stock: </span>
                            {product.stock}
                            <span className="hidden md:inline">unid.</span>
                          </span>
                        </div>

                        {/* Botón Agregar */}
                        <div className="md:col-span-1 flex items-center md:justify-center mt-2 md:mt-0">
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock < 1}
                            className={`w-full md:w-auto bg-blue-500 text-white px-4 py-2 md:p-2 rounded-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 font-medium text-sm shadow-md
                              ${product.stock < 1 ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400" : ""}
                              ${animatingProduct === product.id ? "animate-add-to-cart" : ""}
                            `}
                            title={
                              product.stock < 1
                                ? "Sin stock disponible"
                                : "Agregar al carrito"
                            }
                          >
                            <Plus size={18} className="flex-shrink-0" />
                            <span className="md:hidden">Agregar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Carrito */}
        <div className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
          <div className="p-3 md:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center gap-2 text-white">
              <ShoppingCart size={20} className="md:w-6 md:h-6" />
              <h2 className="text-lg md:text-xl font-bold">Carrito</h2>
              {cart.length > 0 && (
                <span className="ml-auto bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs md:text-sm font-bold">
                  {cart.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
            {/* Cliente con Búsqueda */}
            <div className="relative client-search-container">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cliente *
              </label>
              <div className="relative">
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientSuggestions(true);
                    if (!e.target.value) {
                      setSelectedClient("");
                    }
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                  placeholder="Buscar o crear cliente..."
                  className="w-full pl-8 pr-2 md:pr-3 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dropdown de Sugerencias */}
              {showClientSuggestions && clientSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <User size={14} className="text-gray-400" />
                        <span>{client.nombre}</span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateNewClient}
                      className="w-full px-3 py-3 text-left hover:bg-green-50 text-sm"
                    >
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Plus size={16} />
                        <span>Cliente no existe - Crear "{clientSearch}"</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Alerta de Deuda */}
            {selectedClient && clientDebt > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 animate-pulse">
                <div className="bg-red-100 p-1.5 rounded-full">
                  <DollarSign className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">
                    Cliente con Deuda Pendiente
                  </h4>
                  <p className="text-xs text-red-600 mt-0.5">
                    Este cliente debe:{" "}
                    <span className="font-bold text-lg">
                      ${clientDebt.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Tipo de Pago */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tipo de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType("contado");
                    setPartialPayment("");
                  }}
                  className={`flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                    paymentType === "contado"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Contado</span>
                  <span className="sm:hidden">$</span>
                </button>

                {/* ✅ Deshabilitar crédito si es Cliente General */}
                <button
                  type="button"
                  onClick={() => {
                    if (parseInt(selectedClient) !== 1) {
                      setPaymentType("credito");
                    }
                  }}
                  disabled={parseInt(selectedClient) === 1}
                  className={`flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                    parseInt(selectedClient) === 1
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                      : paymentType === "credito"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-300"
                  }`}
                  title={
                    parseInt(selectedClient) === 1
                      ? "No se pueden hacer ventas fiadas al Cliente General"
                      : ""
                  }
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">Deuda</span>
                  <span className="sm:hidden">Deuda</span>
                </button>
              </div>

              {/* ✅ Advertencia cuando se selecciona Cliente General */}
              {parseInt(selectedClient) === 1 && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <p className="text-xs text-amber-800 font-medium">
                    ⚠️ El Cliente General solo puede realizar compras al
                    contado. Para ventas fiadas, cree un cliente específico.
                  </p>
                </div>
              )}
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("efectivo")}
                  className={`flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                    paymentMethod === "efectivo"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300"
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transferencia")}
                  className={`flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                    paymentMethod === "transferencia"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">Transfer.</span>
                  <span className="sm:hidden">Trans.</span>
                </button>
              </div>
            </div>

            {/* Abono Inicial */}
            {paymentType === "credito" && (
              <div className="bg-orange-50 p-2 md:p-3 rounded-lg">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Abono Inicial (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={calculateTotal()}
                  value={partialPayment}
                  onChange={(e) => setPartialPayment(e.target.value)}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>
            )}

            {/* Descuento Ocasional */}
            <div className="bg-purple-50 p-2 md:p-3 rounded-lg border-2 border-purple-200">
              <label className="block text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Descuento Ocasional (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={getSubtotal()}
                value={occasionalDiscount}
                onChange={(e) => setOccasionalDiscount(e.target.value)}
                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
              {occasionalDiscount && parseFloat(occasionalDiscount) > 0 && (
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  Se aplicará un descuento de $
                  {parseFloat(occasionalDiscount).toLocaleString()}
                </p>
              )}
            </div>

            {/* Nota de Venta */}
            <div className="bg-gray-50 p-2 md:p-3 rounded-lg border border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nota (Opcional)
              </label>
              <textarea
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Escribe alguna nota o detalle importante sobre la venta..."
                rows="2"
              />
            </div>

            {/* Items del Carrito */}
            <div className="border-t pt-2 md:pt-3">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Productos ({cart.length})
              </label>
              {cart.length === 0 ? (
                <div className="text-center py-4 md:py-6 text-gray-400">
                  <ShoppingCart
                    size={32}
                    className="mx-auto mb-2 opacity-30 md:w-9 md:h-9"
                  />
                  <p className="text-xs md:text-sm">Carrito vacío</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.producto_id}
                      className="bg-gray-50 p-2 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">
                            {item.nombre}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.tipo} - {item.presentacion}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.producto_id)}
                          className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.producto_id,
                                item.cantidad - 1,
                              )
                            }
                            className="w-6 h-6 md:w-7 md:h-7 bg-gray-200 rounded text-sm hover:bg-gray-300"
                            disabled={item.cantidad <= 1}
                          >
                            -
                          </button>
                          <span className="w-6 md:w-8 text-center font-semibold text-xs md:text-sm">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.producto_id,
                                item.cantidad + 1,
                              )
                            }
                            className="w-6 h-6 md:w-7 md:h-7 bg-gray-200 rounded text-sm hover:bg-gray-300"
                            disabled={item.cantidad >= item.stock_disponible}
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-xs md:text-sm text-green-600">
                          ${item.subtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            {paymentType === "credito" &&
              partialPayment &&
              parseFloat(partialPayment) > 0 && (
                <div className="bg-orange-50 p-2 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Abono:</span>
                    <span className="font-semibold text-green-600">
                      ${parseFloat(partialPayment).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pendiente:</span>
                    <span className="font-semibold text-orange-600">
                      $
                      {(
                        calculateTotal() - parseFloat(partialPayment)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

            {/* Desglose de totales */}
            {occasionalDiscount && parseFloat(occasionalDiscount) > 0 ? (
              <div className="space-y-1 bg-white p-2 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-800">
                    ${getSubtotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-600 font-medium">
                    Descuento:
                  </span>
                  <span className="font-semibold text-purple-600">
                    -${parseFloat(occasionalDiscount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-purple-200">
                  <span className="text-base md:text-lg font-bold">Total:</span>
                  <span className="text-xl md:text-2xl font-bold text-green-600">
                    ${calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-base md:text-lg font-bold">Total:</span>
                <span className="text-xl md:text-2xl font-bold text-green-600">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || !selectedClient}
              className={`w-full py-2.5 md:py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
                cart.length === 0 || !selectedClient
                  ? "bg-gray-300 cursor-not-allowed"
                  : paymentType === "credito"
                    ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              }`}
            >
              <Check size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">
                {paymentType === "credito"
                  ? "Registrar Fiada"
                  : "Completar Venta"}
              </span>
              <span className="sm:hidden">
                {paymentType === "credito" ? "Fiada" : "Venta"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <SuccessModal
        isOpen={successModal.isOpen}
        amount={successModal.amount}
        saleType={successModal.saleType}
        onClose={() =>
          setSuccessModal({ isOpen: false, amount: 0, saleType: "contado" })
        }
      />

      {/* Modal de Crear Cliente */}
      <ClientFormModal
        isOpen={showClientModal}
        editingClient={null}
        formData={clientFormData}
        setFormData={setClientFormData}
        onSubmit={handleClientSubmit}
        onClose={() => {
          setShowClientModal(false);
          setClientFormData({
            nombre: "",
            telefono: "",
            correo: "",
            direccion: "",
          });
        }}
      />

      {/* Modal de Confirmación de Venta */}
      <SaleConfirmationModal
        isOpen={showConfirmationModal}
        cart={cart}
        total={calculateTotal()}
        paymentType={paymentType}
        paymentMethod={paymentMethod}
        partialPayment={partialPayment}
        occasionalDiscount={occasionalDiscount}
        clientDebt={clientDebt}
        onConfirm={handleConfirmSale}
        onCancel={() => setShowConfirmationModal(false)}
      />

      {/* Modal de Información del Producto */}
      <ProductInfoModal
        isOpen={productInfoModal.isOpen}
        product={productInfoModal.product}
        onClose={() => setProductInfoModal({ isOpen: false, product: null })}
      />


      {/* Estilos para animaciones */}
      <style>{`
        @keyframes add-to-cart {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-add-to-cart {
          animation: add-to-cart 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Sales;
