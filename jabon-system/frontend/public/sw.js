// Service Worker para Sistema de Inventario PWA
const CACHE_VERSION = 'v1.0.7';
const CACHE_NAME = `inventario-cache-${CACHE_VERSION}`;
const API_CACHE = `inventario-api-${CACHE_VERSION}`;

// Recursos críticos para pre-cachear (excluimos index.html para evitar que se quede pegado)
const PRECACHE_URLS = [
    '/offline.html',
    '/logo/PNGLOGO.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-cacheando recursos críticos');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting()) // Activar inmediatamente
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Eliminar cachés antiguos
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name.startsWith('inventario-') &&
                                name !== CACHE_NAME &&
                                name !== API_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Eliminando caché antiguo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim()) // Tomar control inmediatamente
    );
});

// Interceptar peticiones (Fetch)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar peticiones que no sean HTTP/HTTPS
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // IMPORTANTE: NO interceptar llamadas a la API. Dejar que el navegador las maneje directamente.
    // Esto soluciona el problema de "falsos positivos" o respuestas cacheadas en PC.
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Estrategia para assets estáticos
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
        return;
    }

    // Estrategia para navegación (HTML)
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstStrategy(request, CACHE_NAME));
        return;
    }

    // Por defecto: Network First
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

// Estrategia: Cache First (para assets estáticos)
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] Cache hit:', request.url);
            return cachedResponse;
        }

        console.log('[SW] Cache miss, fetching:', request.url);
        const networkResponse = await fetch(request);

        // Cachear la respuesta si es exitosa y es GET
        if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Error en cache-first:', error);

        // Si es una navegación, mostrar página offline
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) return offlineResponse;
        }

        throw error;
    }
}

// Estrategia: Network First (para API y navegación)
async function networkFirstStrategy(request, cacheName) {
    try {
        console.log('[SW] Network first:', request.url);
        
        // Para navegación (HTML) y API, evitamos la caché del navegador
        // usando { cache: 'no-store' } para asegurar frescura total
        const fetchOptions = { cache: 'no-store' };
        const networkResponse = await fetch(request.url, fetchOptions).catch(() => fetch(request));

        // Cachear respuestas exitosas SOLO si es GET
        if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
        }

        // Si es navegación y no hay caché, mostrar offline
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) return offlineResponse;
        }

        throw error;
    }
}

// Verificar si es un asset estático
function isStaticAsset(pathname) {
    const staticExtensions = [
        '.js', '.css', '.png', '.jpg', '.jpeg',
        '.svg', '.gif', '.webp', '.woff', '.woff2',
        '.ttf', '.eot', '.ico'
    ];

    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});
