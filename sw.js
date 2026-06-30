// Service Worker — Coaching App
// Stratégie : network-first pour l'HTML (toujours la dernière version),
// cache-first pour les autres ressources (images, fonts…)
//
// ⚠️ POUR PUBLIER UNE MISE À JOUR :
//    Change le numéro ci-dessous (v1 -> v2 -> v3…) avant d'uploader sur GitHub.
//    Ça force l'appli à jeter l'ancien cache et à prendre la nouvelle version.

const CACHE_NAME = 'coaching-app-v3';

self.addEventListener('install', event => {
  self.skipWaiting(); // Active immédiatement sans attendre la fermeture des onglets
});

self.addEventListener('activate', event => {
  // Supprimer TOUS les anciens caches (ne garder que la version courante)
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pour la page principale : toujours réseau d'abord, sans cache navigateur
  if (event.request.mode === 'navigate' ||
      url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('/Coaching-App/') ||
      url.pathname === '/Coaching-App') {
    event.respondWith(
      // cache:'no-store' empêche le navigateur de resservir l'ancien HTML
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          // Mettre en cache la nouvelle version (uniquement pour le secours hors-ligne)
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

// Clic sur une notification → focus ou ouvre l'appli
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/Coaching-App/');
    })
  );
});
