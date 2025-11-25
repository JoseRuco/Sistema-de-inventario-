import { useState, useEffect } from 'react';
import { Save, Mail, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { getConfig, updateConfig } from '../../services/api';

const Configuracion = () => {
    const [config, setConfig] = useState({
        alert_email: '',
        alert_subject: '',
        alert_message: '',
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await getConfig();
            setConfig(response.data);
        } catch (error) {
            console.error('Error cargando configuración:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await updateConfig(config);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            // Recargar para asegurar que tenemos los datos frescos (especialmente la contraseña enmascarada)
            loadConfig();
        } catch (error) {
            console.error('Error guardando configuración:', error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                <p className="text-gray-600">Administra las alertas y notificaciones del sistema</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <p>{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alertas de Stock */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <Mail className="text-blue-600" size={20} />
                        <h2 className="font-semibold text-gray-800">Alertas de Stock Bajo</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo para recibir alertas
                            </label>
                            <input
                                type="email"
                                name="alert_email"
                                value={config.alert_email || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Asunto del correo
                            </label>
                            <input
                                type="text"
                                name="alert_subject"
                                value={config.alert_subject || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Alerta: Stock Bajo - {producto}"
                            />
                            <p className="text-xs text-gray-500 mt-1">Usa <code>{'{producto}'}</code> para insertar el nombre del producto.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mensaje del correo
                            </label>
                            <textarea
                                name="alert_message"
                                value={config.alert_message || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="El producto {producto} tiene un stock bajo de {stock} unidades."
                            />
                            <p className="text-xs text-gray-500 mt-1">Usa <code>{'{producto}'}</code> y <code>{'{stock}'}</code> como variables.</p>
                        </div>
                    </div>
                </div>

                {/* Configuración SMTP */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                        <Server className="text-purple-600" size={20} />
                        <h2 className="font-semibold text-gray-800">Configuración SMTP (Servidor de Correo)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Servidor SMTP (Host)
                            </label>
                            <input
                                type="text"
                                name="smtp_host"
                                value={config.smtp_host || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="smtp.gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Puerto SMTP
                            </label>
                            <input
                                type="number"
                                name="smtp_port"
                                value={config.smtp_port || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="587"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Usuario SMTP (Correo)
                            </label>
                            <input
                                type="email"
                                name="smtp_user"
                                value={config.smtp_user || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="tu-correo@gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña de Aplicación
                            </label>
                            <input
                                type="password"
                                name="smtp_pass"
                                value={config.smtp_pass || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Para Gmail, usa una "Contraseña de Aplicación". No uses tu contraseña normal.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 px-6 py-3"
                    >
                        <Save size={20} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Configuracion;
