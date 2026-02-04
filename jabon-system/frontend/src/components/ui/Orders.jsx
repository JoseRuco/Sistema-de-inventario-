import { useState, useEffect } from 'react';
import { Plus, Calendar, User, Search, Trash2, Check, Package, Truck, Clock, AlertCircle, X, CheckCircle, RefreshCcw, ShoppingCart } from 'lucide-react';
import { getOrders, createOrder, updateOrderStatus, updateOrder, getProducts, getClients, createClient } from '../../services/api';
import Notification from './Notification';
import ClientFormModal from './ClientFormModal';
import AddProductModal from './AddProductModal';
import Portal from './Portal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [notification, setNotification] = useState(null);
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null); // Estado para modal de éxito
  const [rescheduleOrder, setRescheduleOrder] = useState(null); // Estado para reagendar de en traslado
  const [newDate, setNewDate] = useState('');

  // New Order State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [cart, setCart] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNote, setOrderNote] = useState(''); // Estado para la nota
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  
  // Client creation
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersPendingRes, ordersTransitRes, productsRes, clientsRes] = await Promise.all([
        getOrders({ status: 'pendiente' }), 
        getOrders({ status: 'en_traslado' }),
        getProducts(),
        getClients()
      ]);
      setOrders([...ordersPendingRes.data.data, ...ordersTransitRes.data.data]);
      setProducts(productsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
  };

  // --- Order Creation Logic ---

  const handleAddToCart = (product) => {
    // Validación inicial de stock
    if (product.stock <= 0) {
      showNotification('warning', 'Sin Stock', 'No hay unidades disponibles de este producto');
      return;
    }

    const existing = cart.find(item => item.producto_id === product.id);
    if (existing) {
      // Validación al incrementar
      if (product.stock && existing.cantidad >= product.stock) {
        showNotification('warning', 'Stock Limitado', `Solo quedan ${product.stock} unidades disponibles`);
        return;
      }
      setCart(cart.map(item => 
        item.producto_id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCart([...cart, {
        producto_id: product.id,
        nombre: product.nombre,
        aroma: product.aroma,
        presentacion: product.presentacion,
        stock_actual: product.stock,
        cantidad: 1
      }]);
    }
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty < 1) return;

    const item = cart.find(i => i.producto_id === productId);
    
    // Validar stock máximo
    if (item && newQty > item.stock_actual) {
        showNotification('warning', 'Stock Máximo', `Solo hay ${item.stock_actual} unidades en inventario`);
        return;
    }

    setCart(cart.map(item => 
      item.producto_id === productId ? { ...item, cantidad: newQty } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.producto_id !== productId));
  };

  const handleSubmitOrder = async () => {
    if (!selectedClient) {
      showNotification('warning', 'Falta Cliente', 'Por favor selecciona un cliente');
      return;
    }
    if (cart.length === 0) {
      showNotification('warning', 'Carrito Vacío', 'Agrega productos al pedido');
      return;
    }
    if (!deliveryDate) {
      showNotification('warning', 'Falta Fecha', 'Selecciona una fecha de entrega');
      return;
    }

    try {
      const payload = {
        cliente_id: selectedClient,

        fecha_entrega: deliveryDate,
        nota: orderNote, // Enviar nota
        productos: cart
      };

      await createOrder(payload);
      showNotification('success', 'Pedido Creado', 'El pedido se ha registrado exitosamente');
      setShowNewOrderModal(false);
      
      // Reset form
      setCart([]);
      setSelectedClient('');
      setClientSearch('');

      setDeliveryDate('');
      setOrderNote(''); // Reset nota
      
      loadData(); // Refresh list
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification('error', 'Error', 'No se pudo crear el pedido');
    }
  };

  // --- Status Updates ---

  const requestMarkAsEnCamino = (orderId) => {
    setConfirmOrderId(orderId);
  };

  const confirmMarkAsEnCamino = async () => {
    if (!confirmOrderId) return;
    try {
      await updateOrderStatus(confirmOrderId, 'en_traslado');
      showNotification('success', 'Pedido en Traslado', 'El pedido ahora está en traslado.');
      setConfirmOrderId(null);
      loadData(); 
    } catch (error) {
       console.error('Error updating order:', error);
       showNotification('error', 'Error', 'No se pudo actualizar el estado');
    }
  };

  const handleOrderSuccess = (orderId) => {
    setSuccessOrderId(orderId);
  };

  const confirmOrderSuccess = async () => {
    if (!successOrderId) return;
    try {
        // Marcamos como entregado (completado)
        await updateOrderStatus(successOrderId, 'entregado');
        showNotification('success', 'Pedido Entregado', 'Venta exitosa. Recuerda registrar la venta.');
        setSuccessOrderId(null);
        loadData();
    } catch (error) {
        console.error('Error completing order:', error);
        showNotification('error', 'Error', 'No se pudo completar el pedido');
    }
  };

  const openRescheduleModal = (order) => {
      setRescheduleOrder(order);
      setNewDate('');
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate) {
        showNotification('warning', 'Falta Fecha', 'Selecciona una nueva fecha');
        return;
    }
    try {
        await updateOrder(rescheduleOrder.id, {
            fecha_entrega: newDate,
            estado: 'pendiente'
        });
        showNotification('success', 'Pedido Reagendado', 'El pedido ha vuelto a pendientes con nueva fecha.');
        setRescheduleOrder(null);
        loadData();
    } catch (error) {
        console.error('Error rescheduling:', error);
        showNotification('error', 'Error', 'No se pudo reagendar');
    }
  };


  // --- Client Handling ---
  const handleSelectClient = (client) => {
    setSelectedClient(client.id);
    setClientSearch(client.nombre);
    setShowClientSuggestions(false);
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createClient(clientFormData);
      const newClient = res.data;
      setClients([...clients, newClient]);
      handleSelectClient(newClient);
      setShowClientModal(false);
      showNotification('success', 'Cliente Creado', 'Cliente registrado correctamente');
    } catch(err) {
      showNotification('error', 'Error', 'Error al crear cliente');
    }
  };


  // --- Render ---

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.presentacion.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
     c.nombre.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-blue-600" />
            Pedidos y Encargos
          </h1>
          <p className="text-gray-500 text-sm">Gestiona los pedidos pendientes de entrega</p>
        </div>
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Pedido
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No hay pedidos pendientes</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col hover:shadow-lg transition-shadow">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                       <User size={16} className="text-gray-400" />
                       {order.cliente_nombre}
                    </h3>
                     <p className="text-xs text-gray-500">{order.cliente_telefono || 'Sin teléfono'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                      order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {order.estado === 'en_traslado' ? 'EN TRASLADO' : order.estado.toUpperCase()}
                  </span>
                </div>
                
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                    <Clock size={16} className="text-blue-500" />
                    Entrega: <strong>{(() => {
                      if (!order.fecha_entrega) return 'Sin fecha';
                      const [year, month, day] = order.fecha_entrega.split('-');
                      return new Date(year, month - 1, day).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      });
                    })()}</strong>
                  </div>

                  {/* Mostrar nota si existe */}
                  {order.notas && (
                    <div className="mb-3 bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
                       <span className="shrink-0 mt-0.5" title="Nota del pedido">📝</span>
                       <p className="italic">{order.notas}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos:</p>
                     {order.productos.map((prod, idx) => (
                       <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 gap-2">
                         <div className="flex flex-col min-w-0 flex-1">
                           <span className="text-gray-800 font-semibold text-sm truncate">{prod.nombre}</span>
                           <div className="flex flex-wrap gap-1 mt-1">
                             <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                               {prod.aroma}
                             </span>
                             <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                               {prod.presentacion}
                             </span>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold bg-gray-100 px-2 py-1 rounded-lg text-gray-700 text-xs shadow-sm">x{prod.cantidad}</span>
                            {prod.stock_actual < prod.cantidad && (
                              <AlertCircle size={18} className="text-red-500" title="Stock insuficiente" />
                            )}
                         </div>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 relative">
                   {order.estado === 'pendiente' ? (
                       <button 
                         onClick={() => requestMarkAsEnCamino(order.id)}
                         className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                       >
                         <Truck size={18} />
                         En Camino
                       </button>
                   ) : (
                       <div className="flex gap-2">
                           <button 
                             onClick={() => handleOrderSuccess(order.id)}
                             className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 shadow-sm"
                           >
                             <CheckCircle size={16} />
                             PEDIDO EXITOSO
                           </button>
                           <button 
                             onClick={() => openRescheduleModal(order)}
                             className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 shadow-sm"
                           >
                             <RefreshCcw size={16} />
                             RE AGENDAR
                           </button>
                       </div>
                   )}
                   {order.estado === 'pendiente' && (
                       <p className="text-xs text-center text-gray-500 mt-2">
                         Pasará a estado "En Traslado"
                       </p>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Confirmación de Entrega */}
      {confirmOrderId && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                <div className="flex items-center justify-center">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full mb-2">
                    <Truck size={32} className="text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white text-center">
                  ¿Confirmar Entrega?
                </h3>
                <p className="text-green-100 text-sm text-center mt-2">
                  Esta acción marcará el pedido como "En Camino"
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Truck className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        El pedido cambiará de estado a <strong>EN TRASLADO</strong>. 
                        Podrás marcarlo como exitoso o reagendarlo después.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmOrderId(null)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmMarkAsEnCamino}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold shadow-lg transition-all"
                  >
                    Confirmar Traslado
                  </button>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes scale-in {
                from {
                  opacity: 0;
                  transform: scale(0.9);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }

              .animate-scale-in {
                animation: scale-in 0.2s ease-out;
              }
            `}</style>
          </div>
        </Portal>
      )}
      
      {/* Modal Reagendar */}
      {rescheduleOrder && (
          <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <RefreshCcw className="text-amber-500" />
                      Reagendar Pedido
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                      Selecciona una nueva fecha para el pedido de <strong>{rescheduleOrder.cliente_nombre}</strong>.
                  </p>
                  
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nueva Fecha de Entrega</label>
                      <input 
                        type="date" 
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setRescheduleOrder(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handleRescheduleSubmit}
                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-md"
                      >
                          Guardar
                      </button>
                  </div>
              </div>
            </div>
          </Portal>
      )}

      {/* Modal Confirmación de Éxito */}
      {successOrderId && (
          <Portal>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                  <div className="text-center mb-6">
                      <div className="bg-green-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                          <CheckCircle size={40} className="text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">¡Pedido Exitoso!</h3>
                      <p className="text-gray-500 mt-2">El pedido se marcará como entregado y saldrá de la lista.</p>
                  </div>

                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-center">
                      <p className="text-red-700 font-extrabold text-lg uppercase">
                          ¡Recuerda registrar<br/>la venta!
                      </p>
                      <p className="text-xs text-red-500 mt-1">Este paso NO registra la venta automáticamente en contabilidad.</p>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setSuccessOrderId(null)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 bg-white"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmOrderSuccess}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                      >
                          Confirmar y Cerrar
                      </button>
                  </div>
              </div>
            </div>
          </Portal>
      )}

      {/* Modal Nuevo Pedido */}
      {showNewOrderModal && (
        <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
             
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Plus size={24} /> Nuevo Pedido
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">Crea un nuevo pedido para un cliente</p>
                  </div>
                  <button 
                    onClick={() => setShowNewOrderModal(false)} 
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

             <div className="flex-1 overflow-y-auto p-6 bg-white">
                <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                  {/* Column 1: Client & Delivery Info */}
                  <div className="space-y-6">
                    <section>
                      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                        <User size={16} className="text-blue-500" />
                        Datos del Cliente
                      </h3>
                      
                      {/* Client Selection */}
                      <div className="relative">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Buscar Cliente</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input 
                            type="text"
                            value={clientSearch}
                            onChange={(e) => {
                              setClientSearch(e.target.value);
                              setShowClientSuggestions(true);
                              if (!e.target.value) setSelectedClient('');
                            }}
                            onFocus={() => setShowClientSuggestions(true)}
                            placeholder="Nombre del cliente..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        {showClientSuggestions && clientSearch && (
                          <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2">
                            {filteredClients.length > 0 ? (
                               filteredClients.map(client => (
                                 <div 
                                   key={client.id}
                                   onClick={() => handleSelectClient(client)}
                                   className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex justify-between items-center"
                                 >
                                   <div>
                                     <div className="font-semibold text-gray-800">{client.nombre}</div>
                                     <div className="text-xs text-gray-500">{client.telefono}</div>
                                   </div>
                                   <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Check size={16} />
                                   </div>
                                 </div>
                               ))
                            ) : (
                              <div 
                                onClick={() => {
                                    setClientFormData({...clientFormData, nombre: clientSearch});
                                    setShowClientModal(true);
                                    setShowClientSuggestions(false);
                                }}
                                className="p-3 text-blue-600 hover:bg-blue-50 cursor-pointer font-semibold text-sm flex items-center gap-2"
                              >
                                 <Plus size={16} /> Crear nuevo cliente "{clientSearch}"
                              </div>
                            )}
                          </div>
                        )}
                        {selectedClient && (
                             <div className="mt-2 text-xs text-green-700 font-bold bg-green-50 p-2 rounded-lg border border-green-200 flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <Check size={14} className="bg-green-500 text-white rounded-full p-0.5" /> 
                                 {clients.find(c => c.id === selectedClient)?.nombre}
                               </div>
                               <button 
                                 onClick={() => {
                                   setSelectedClient('');
                                   setClientSearch('');
                                 }}
                                 className="text-green-600 hover:text-green-800"
                               >
                                 <X size={14} />
                               </button>
                             </div>
                        )}
                      </div>
                    </section>

                    <section className="grid grid-cols-1 gap-4">
                      {/* Date Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Calendar size={12} /> Fecha de Entrega
                        </label>
                        <input 
                          type="date" 
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Note Input */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nota del Pedido (Opcional)</label>
                        <textarea 
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          placeholder="Instrucciones especiales para la entrega..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-24 shadow-sm"
                        />
                      </div>
                    </section>
                  </div>

                  {/* Column 2: Cart & Add Product Action */}
                  <div className="flex flex-col h-full space-y-4">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col h-full shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Package size={18} className="text-indigo-500" />
                          Carrito de Pedido
                        </h3>
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                          {cart.reduce((acc, item) => acc + item.cantidad, 0)} items
                        </span>
                      </div>
                      
                      {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                          <div className="bg-gray-200 p-4 rounded-full mb-3 text-gray-400">
                            <ShoppingCart size={32} />
                          </div>
                          <p className="text-gray-500 text-sm font-medium">El carrito está vacío</p>
                          <p className="text-gray-400 text-xs mt-1">Usa el botón de abajo para agregar productos</p>
                        </div>
                      ) : (
                        <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300">
                          {cart.map(item => (
                            <div key={item.producto_id} className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 hover:border-indigo-200 transition-colors">
                              <div className="flex-1 min-w-0 mr-3">
                                <div className="text-sm font-bold text-gray-800 truncate">{item.nombre}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                    {item.aroma}
                                  </span>
                                  <span className="text-[10px] bg-purple-100 text-purple-800 px-3 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                    {item.presentacion}
                                  </span>
                                </div>
                              </div>
                              <div className="inline-block items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                 <button 
                                   onClick={() => updateCartQuantity(item.producto_id, item.cantidad + 1)} 
                                   className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                 >+</button>
                                 
                                 <span className="text-xs w-6 text-center pl-1 ml-2 font-bold text-gray-800">{item.cantidad}</span>
                                 
                                 <button 
                                   onClick={() => updateCartQuantity(item.producto_id, item.cantidad - 1)} 
                                   className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                 >-</button>

                              </div>
                              <button 
                                onClick={() => removeFromCart(item.producto_id)} 
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all ml-1"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botón AGREGAR PRODUCTO similar a Sales */}
                      <button
                        onClick={() => setShowAddProductModal(true)}
                        className="w-full mt-auto py-4 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-100 hover:border-indigo-300 transition-all group"
                      >
                        <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <span className="font-bold text-indigo-700 uppercase tracking-widest text-sm">Agregar Producto</span>
                        <p className="text-[10px] text-indigo-500 font-medium">Selecciona producto, aroma y presentación</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 bg-gray-100 flex gap-4 flex-shrink-0">
                <button 
                  onClick={() => setShowNewOrderModal(false)}
                  className="flex-1 px-4 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  Cerrar
                </button>
                <button 
                  onClick={handleSubmitOrder}
                  className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-bold shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Confirmar Pedido
                </button>
              </div>
          </div>
        </div>
        
        {/* Modal de Selección de Productos Integradado */}
        <AddProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          products={products}
          onAddToCart={(product) => {
            handleAddToCart(product);
            setShowAddProductModal(false);
          }}
        />
        </Portal>
      )}

      {/* Client Modal */}
      <ClientFormModal 
        isOpen={showClientModal}
        formData={clientFormData}
        setFormData={setClientFormData}
        onSubmit={handleClientSubmit}
        onClose={() => setShowClientModal(false)}
      />

      {notification && (
        <div className="fixed top-4 right-4 z-[60]">
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Orders;
