import { useState, useEffect } from 'react';
import { Plus, Calendar, User, Search, Trash2, Check, Package, Truck, Clock, AlertCircle, X } from 'lucide-react';
import { getOrders, createOrder, updateOrderStatus, getProducts, getClients, createClient } from '../../services/api';
import Notification from './Notification';
import ClientFormModal from './ClientFormModal';
import Portal from './Portal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [notification, setNotification] = useState(null);
  const [confirmOrderId, setConfirmOrderId] = useState(null);

  // New Order State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [cart, setCart] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNote, setOrderNote] = useState(''); // Estado para la nota
  
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
      const [ordersRes, productsRes, clientsRes] = await Promise.all([
        getOrders({ status: 'pendiente' }), // Initially fetch pending orders
        getProducts(),
        getClients()
      ]);
      setOrders(ordersRes.data.data);
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
    const existing = cart.find(item => item.producto_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.producto_id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCart([...cart, {
        producto_id: product.id,
        nombre: product.nombre,
        presentacion: product.presentacion,
        stock_actual: product.stock,
        cantidad: 1
      }]);
    }
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty < 1) return;
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
      await updateOrderStatus(confirmOrderId, 'en_camino');
      showNotification('success', 'Pedido Actualizado', 'El pedido ha sido marcado como "En Camino" y movido del listado pendiente.');
      setConfirmOrderId(null);
      loadData(); 
    } catch (error) {
       console.error('Error updating order:', error);
       showNotification('error', 'Error', 'No se pudo actualizar el estado');
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
                      order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.estado.toUpperCase()}
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
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0">
                        <span className="text-gray-700">{prod.nombre} = <span className="px-1 py-1 bg-blue-100 text-blue-800 rounded text-xs"> {prod.presentacion}</span></span>
                        <div className="flex items-center gap-2">
                           <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">x{prod.cantidad}</span>
                           {prod.stock_actual < prod.cantidad && (
                             <AlertCircle size={20} className="text-red-500" title="Stock insuficiente" />
                             
                           )}

                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 relative">
                   <button 
                     onClick={() => requestMarkAsEnCamino(order.id)}
                     className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                   >
                     <Truck size={18} />
                     En Camino / Completar
                   </button>
                   <p className="text-xs text-center text-gray-500 mt-2">
                     Al marcar como "En Camino", el pedido desaparecerá de esta lista.
                   </p>
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
                    <AlertCircle className="text-yellow-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        El pedido desaparecerá de la lista de pedidos pendientes y se marcará como completado.
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold shadow-lg transition-all"
                  >
                    Sí, Completar
                  </button>
                </div>
              </div>
            </div>

            <style jsx>{`
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

             <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 relative bg-white">
                
                 {/* Left Column: Client & Date & Cart */}
                 <div className="p-6 overflow-y-auto max-h-[40vh] lg:max-h-full border-b lg:border-b-0 lg:border-r border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Datos del Cliente</h3>
                  
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
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* ... (Suggestions logic remains same but simplified for brevity in replacement if possible, but keeping full logic is safer) ... */}
                    {showClientSuggestions && clientSearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-40 overflow-auto">
                        {filteredClients.length > 0 ? (
                           filteredClients.map(client => (
                             <div 
                               key={client.id}
                               onClick={() => handleSelectClient(client)}
                               className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                             >
                               <div className="font-semibold">{client.nombre}</div>
                               <div className="text-xs text-gray-500">{client.telefono}</div>
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
                             <Plus size={16} /> Crear "{clientSearch}"
                          </div>
                        )}
                      </div>
                    )}
                    {selectedClient && (
                         <div className="mt-2 text-xs text-green-700 font-bold bg-green-50 p-2 rounded border border-green-200 flex items-center gap-2">
                           <Check size={12}/> {clients.find(c => c.id === selectedClient)?.nombre}
                         </div>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Entrega</label>
                    <input 
                      type="date" 
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Note Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nota (Opcional)</label>
                    <textarea 
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Ej: Entregar por la tarde..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-20"
                    />
                  </div>

                  {/* Cart Summary (Left Side) - Flexible Height */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                      <Package size={16}/> 
                      Productos ({cart.reduce((acc, item) => acc + item.cantidad, 0)})
                    </h3>
                    
                    {cart.length === 0 ? (
                      <p className="text-gray-400 text-xs text-center py-4 italic">Selecciona productos...</p>
                    ) : (
                      <div className="space-y-2 overflow-y-auto max-h-40 lg:max-h-[300px] pr-1">
                        {cart.map(item => (
                          <div key={item.producto_id} className="bg-white p-2 rounded shadow-sm flex items-center justify-between border border-gray-100">
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="text-sm font-semibold truncate">{item.nombre}</div>
                              <div className="text-xs text-gray-500 truncate">{item.presentacion}</div>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
                               <button onClick={() => updateCartQuantity(item.producto_id, item.cantidad - 1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 rounded">-</button>
                               <span className="text-xs w-6 text-center font-medium">{item.cantidad}</span>
                               <button onClick={() => updateCartQuantity(item.producto_id, item.cantidad + 1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 rounded">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.producto_id)} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                 {/* Right Column: Product Selection - Must always be visible/scrollable */}
                 <div className="flex flex-col h-full overflow-hidden p-6 bg-white">
                   <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-3">Agregar Productos</h3>
                   <div className="relative mb-3 shrink-0">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input 
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar jabones..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                   </div>
                   
                   <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2 bg-gray-50 shadow-inner">
                      {filteredProducts.map(product => {
                         const inCart = cart.find(c => c.producto_id === product.id);
                         return (
                            <div key={product.id} className={`p-3 rounded-lg border shadow-sm flex justify-between items-center transition-all ${inCart ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                               <div className="flex-1 min-w-0 mr-2">
                                 <div className="font-semibold text-sm text-gray-800 truncate">{product.nombre}</div>
                                 <div className="text-xs text-gray-500">{product.presentacion}</div>
                                 <div className={`text-xs font-bold mt-0.5 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                   Stock: {product.stock}
                                 </div>
                               </div>
                               <button 
                                 onClick={() => handleAddToCart(product)}
                                 className={`p-2 rounded-full transition-colors shrink-0 ${inCart ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}
                               >
                                 <Plus size={18} />
                               </button>
                            </div>
                         );
                      })}
                   </div>
                </div>

             </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0">
                <button 
                  onClick={() => setShowNewOrderModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmitOrder}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  Guardar Pedido
                </button>
              </div>
          </div>
        </div>
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
