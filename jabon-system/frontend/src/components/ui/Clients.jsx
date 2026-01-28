import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, History, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { getClients, createClient, updateClient, deleteClient } from '../../services/api';
import InfoModal from './InfoModal';
import ConfirmDialog from './ConfirmDialog';
import ClientHistory from './ClientHistory';
import ClientFormModal from './ClientFormModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [infoModal, setInfoModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    subtitle: ''
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    clientId: null,
    clientName: ''
  });
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    clientId: null,
    clientName: ''
  });
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const showInfoModal = (type, title, message, subtitle = '') => {
    setInfoModal({ isOpen: true, type, title, message, subtitle });
  };

  const loadClients = async () => {
    try {
      const response = await getClients();
      setClients(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      showInfoModal('error', 'Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        closeModal(); // ✅ Solo cerrar cuando hay éxito
        showInfoModal(
          'edit',
          '¡Cliente Actualizado!',
          `${formData.nombre} se actualizó correctamente`,
          'Los cambios se han guardado'
        );
      } else {
        await createClient(formData);
        closeModal(); // ✅ Solo cerrar cuando hay éxito
        showInfoModal(
          'info',
          '¡Cliente Registrado!',
          `${formData.nombre} se agregó exitosamente`,
          'Ya está disponible en el sistema'
        );
      }
      loadClients();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      // ❌ NO cerrar el modal aquí - mantener el formulario abierto

      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || 'Ya existe un cliente con ese nombre';
        showInfoModal(
          'error',
          'Cliente Duplicado',
          errorMessage,
          'Por favor, verifica el nombre del cliente'
        );
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Datos inválidos';
        showInfoModal(
          'error',
          'Error de Validación',
          errorMessage,
          'Por favor, completa todos los campos requeridos'
        );
      } else {
        const errorMessage = error.response?.data?.message || 'No se pudo guardar el cliente';
        showInfoModal(
          'error',
          'Error',
          errorMessage,
          'Intenta nuevamente o contacta al soporte'
        );
      }
    }
  };



  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      nombre: client.nombre,
      telefono: client.telefono || '',
      correo: client.correo || '',
      direccion: client.direccion || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (client) => {
    setConfirmDialog({
      isOpen: true,
      clientId: client.id,
      clientName: client.nombre
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteClient(confirmDialog.clientId);
      showInfoModal(
        'success',
        'Cliente Desactivado',
        `${confirmDialog.clientName} se desactivó del sistema`,
        'El cliente ya no aparecerá en la lista, pero su historial se mantiene'
      );
      setConfirmDialog({ isOpen: false, clientId: null, clientName: '' });
      loadClients();
    } catch (error) {
      console.error('Error desactivando cliente:', error);
      const errorMsg = error.response?.data?.error || 'No se pudo desactivar el cliente';
      const errorDetail = error.response?.data?.details || '';
      showInfoModal('error', 'Error', errorMsg, errorDetail);
      setConfirmDialog({ isOpen: false, clientId: null, clientName: '' });
    }
  };

  const handleViewHistory = (client) => {
    setHistoryModal({
      isOpen: true,
      clientId: client.id,
      clientName: client.nombre
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      nombre: '',
      telefono: '',
      correo: '',
      direccion: ''
    });
  };

  const filteredClients = clients.filter(client =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.telefono && client.telefono.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <User className="w-8 h-8" />
              </div>
              Clientes
            </h2>
            <p className="text-blue-100 mt-2">Gestión de clientes del sistema</p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>{filteredClients.length} clientes registrados</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-16">
          <User size={56} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No hay clientes</h3>
          <p className="text-sm text-gray-500 mt-1">Comienza agregando tu primer cliente</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <User className="text-blue-600" size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{client.nombre}</p>
                            {/* ✅ Badge para Cliente General */}
                            {client.id === 1 && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                                Sistema
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">ID: {client.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.telefono ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone size={14} className="text-gray-400" />
                          {client.telefono}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin teléfono</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {client.correo ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail size={14} className="text-gray-400" />
                          <span className="truncate max-w-xs">{client.correo}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin correo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {client.direccion ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate max-w-xs">{client.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin dirección</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewHistory(client)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ver historial"
                        >
                          <History size={18} />
                        </button>
                        {/* ✅ Ocultar botones de editar/eliminar para Cliente General (ID = 1) */}
                        {client.id !== 1 && (
                          <>
                            <button
                              onClick={() => handleEdit(client)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(client)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ClientFormModal
        isOpen={showModal}
        editingClient={editingClient}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />

      <ClientHistory
        isOpen={historyModal.isOpen}
        clientId={historyModal.clientId}
        clientName={historyModal.clientName}
        onClose={() => setHistoryModal({ isOpen: false, clientId: null, clientName: '' })}
      />

      <InfoModal
        isOpen={infoModal.isOpen}
        type={infoModal.type}
        title={infoModal.title}
        message={infoModal.message}
        subtitle={infoModal.subtitle}
        onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="¿Desactivar Cliente?"
        message={`¿Estás seguro de que deseas desactivar a ${confirmDialog.clientName}?`}
        subtitle="El cliente dejará de aparecer en la lista, pero su historial se mantendrá."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, clientId: null, clientName: '' })}
      />
    </div>
  );
};

export default Clients;
