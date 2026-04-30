// Service Worker — Coaching App
// Stratégie : network-first pour l'HTML (toujours la dernière version),
// cache-first pour les autres ressources (images, fonts…)

const CACHE_NAME = 'coaching-app-v1';

self.addEventListener('install', event => {
  self.skipWaiting(); // Active immédiatement sans attendre la fermeture des onglets
});

self.addEventListener('activate', event => {
  // Supprimer les anciens caches
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pour la page principale : toujours réseau d'abord
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('/Coaching-App/') ||
      url.pathname === '/Coaching-App') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre en cache la nouvelle version
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // Fallback cache si hors ligne
    );
    return;
  }

  // Pour le reste : cache d'abord, réseau en fallback
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
