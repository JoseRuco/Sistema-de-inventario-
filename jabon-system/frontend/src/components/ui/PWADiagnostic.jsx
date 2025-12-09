import { useEffect, useState } from 'react';
import { Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function PWADiagnostic() {
    const [diagnostics, setDiagnostics] = useState({
        isStandalone: false,
        displayMode: 'browser',
        manifestLoaded: false,
        serviceWorkerActive: false,
        platform: '',
    });

    useEffect(() => {
        const checkPWAStatus = async () => {
            // Verificar si está en modo standalone
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://');

            // Obtener display mode
            let displayMode = 'browser';
            if (window.matchMedia('(display-mode: standalone)').matches) {
                displayMode = 'standalone';
            } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
                displayMode = 'fullscreen';
            } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
                displayMode = 'minimal-ui';
            }

            // Verificar manifest
            const manifestLink = document.querySelector('link[rel="manifest"]');
            let manifestLoaded = false;

            if (manifestLink) {
                try {
                    const response = await fetch(manifestLink.href);
                    manifestLoaded = response.ok;
                } catch (e) {
                    manifestLoaded = false;
                }
            }

            // Verificar Service Worker
            let serviceWorkerActive = false;
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                serviceWorkerActive = registration && registration.active !== null;
            }

            setDiagnostics({
                isStandalone,
                displayMode,
                manifestLoaded,
                serviceWorkerActive,
                platform: navigator.userAgent,
            });
        };

        checkPWAStatus();
    }, []);

    // Solo mostrar en modo desarrollo o si hay problemas
    const shouldShow = !diagnostics.isStandalone ||
        !diagnostics.manifestLoaded ||
        !diagnostics.serviceWorkerActive;

    if (!shouldShow) return null;

    return (
        <div className="fixed bottom-20 right-4 left-4 md:left-auto md:w-96 z-50 bg-white rounded-lg shadow-2xl p-4 border-2 border-yellow-400">
            <div className="flex items-start gap-3 mb-3">
                <Smartphone className="text-yellow-600 flex-shrink-0" size={24} />
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                        Diagnóstico PWA
                    </h3>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                {/* Modo Standalone */}
                <div className="flex items-center gap-2">
                    {diagnostics.isStandalone ? (
                        <CheckCircle className="text-green-600" size={18} />
                    ) : (
                        <XCircle className="text-red-600" size={18} />
                    )}
                    <span className={diagnostics.isStandalone ? 'text-green-700' : 'text-red-700'}>
                        Modo: <strong>{diagnostics.displayMode}</strong>
                    </span>
                </div>

                {/* Manifest */}
                <div className="flex items-center gap-2">
                    {diagnostics.manifestLoaded ? (
                        <CheckCircle className="text-green-600" size={18} />
                    ) : (
                        <XCircle className="text-red-600" size={18} />
                    )}
                    <span className={diagnostics.manifestLoaded ? 'text-green-700' : 'text-red-700'}>
                        Manifest: {diagnostics.manifestLoaded ? 'Cargado' : 'No cargado'}
                    </span>
                </div>

                {/* Service Worker */}
                <div className="flex items-center gap-2">
                    {diagnostics.serviceWorkerActive ? (
                        <CheckCircle className="text-green-600" size={18} />
                    ) : (
                        <AlertCircle className="text-yellow-600" size={18} />
                    )}
                    <span className={diagnostics.serviceWorkerActive ? 'text-green-700' : 'text-yellow-700'}>
                        Service Worker: {diagnostics.serviceWorkerActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>

                {/* Instrucciones si no está en standalone */}
                {!diagnostics.isStandalone && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-yellow-800 font-semibold mb-2">
                            ⚠️ No estás en modo app
                        </p>
                        <p className="text-yellow-700 text-xs">
                            Para usar como app instalada:
                        </p>
                        <ol className="text-yellow-700 text-xs list-decimal list-inside mt-1 space-y-1">
                            <li>Toca el menú (⋮) de Chrome</li>
                            <li>Selecciona "Instalar app"</li>
                            <li>Confirma la instalación</li>
                            <li>Abre desde el icono en tu pantalla</li>
                        </ol>
                    </div>
                )}

                {/* Botón para copiar info de debug */}
                <button
                    onClick={() => {
                        const info = JSON.stringify(diagnostics, null, 2);
                        navigator.clipboard.writeText(info);
                        alert('Información copiada al portapapeles');
                    }}
                    className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
                >
                    Copiar info de debug
                </button>
            </div>
        </div>
    );
}

export default PWADiagnostic;
