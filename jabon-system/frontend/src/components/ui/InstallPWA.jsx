import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Verificar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Verificar si ya fue instalada previamente
        const wasInstalled = localStorage.getItem('pwa-installed');
        if (wasInstalled) {
            setIsInstalled(true);
            return;
        }

        // Capturar el evento beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            // Prevenir que Chrome muestre el prompt automáticamente
            e.preventDefault();

            // Guardar el evento para usarlo después
            setDeferredPrompt(e);

            // Mostrar nuestro botón de instalación
            setShowInstallButton(true);

            console.log('[PWA] Prompt de instalación disponible');
        };

        // Detectar cuando la app fue instalada
        const handleAppInstalled = () => {
            console.log('[PWA] App instalada exitosamente');
            setShowInstallButton(false);
            setIsInstalled(true);
            localStorage.setItem('pwa-installed', 'true');
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            console.log('[PWA] No hay prompt disponible');
            return;
        }

        // Mostrar el prompt de instalación
        deferredPrompt.prompt();

        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`[PWA] Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);

        if (outcome === 'accepted') {
            setShowInstallButton(false);
            localStorage.setItem('pwa-installed', 'true');
        }

        // Limpiar el prompt
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowInstallButton(false);
        // Guardar que el usuario cerró el banner (opcional: podría mostrarse después)
        sessionStorage.setItem('install-banner-dismissed', 'true');
    };

    // No mostrar nada si ya está instalada o no hay prompt disponible
    if (isInstalled || !showInstallButton) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-2xl p-4 text-white">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Cerrar"
                >
                    <X size={18} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                    <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                        <Download size={24} />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                            Instalar Aplicación
                        </h3>
                        <p className="text-sm text-white/90 mb-3">
                            Instala esta app en tu dispositivo para acceso rápido y funcionalidad offline
                        </p>

                        <button
                            onClick={handleInstallClick}
                            className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
                        >
                            Instalar Ahora
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}

export default InstallPWA;
