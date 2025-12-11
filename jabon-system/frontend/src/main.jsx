import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
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
              
              // Opcional: Podríamos mostrar un toast no bloqueante aquí
              // Por ahora, forzamos la actualización silenciosamente si es crítico,
              // o simplemente dejamos que el usuario recargue cuando quiera.
              // Para evitar el loop infinito de recargas, NO recargamos automáticamente
              // a menos que podamos garantizar que no es un ciclo.
              
              // Un enfoque seguro es solo notificar:
              // newWorker.postMessage({ type: 'SKIP_WAITING' }); 
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
}

