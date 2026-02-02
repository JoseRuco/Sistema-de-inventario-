import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA (Solo en Producción)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // === PRODUCCIÓN ===
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado exitosamente:', registration.scope);

          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Manejar actualizaciones del Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                console.log('[PWA] Nueva versión disponible. Actualizando...');
              }
            });
          });
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar Service Worker:', error);
        });

      // Recargar cuando el Service Worker tome control (post-SKIP_WAITING)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  } else {
    // === DESARROLLO ===
    // Desregistrar cualquier SW existente para evitar problemas de caché en localhost
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister().then((success) => {
           if (success) {
             console.log('[PWA-DEV] Service Worker desregistrado para evitar caché en desarrollo.');
             // Opcional: Recargar la página una vez para asegurar que se carga todo fresco
             // window.location.reload(); 
           }
        });
      }
    });
  }
}

