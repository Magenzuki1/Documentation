'use strict';

const CACHE_NAME = 'stock-alerts-v1';
// self.registration.scope se termine toujours par "/" : sert de base pour
// construire les URLs absolues des assets, quel que soit le chemin de
// deploiement (fonction Supabase servie sous /functions/v1/app/).
const BASE = self.registration.scope;
const CORE_ASSETS = [
  BASE,
  `${BASE}style.css`,
  `${BASE}app.js`,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Alerte Bourse', body: '' };
  try {
    data = event.data.json();
  } catch (err) {
    data.body = event.data ? event.data.text() : '';
  }

  const options = {
    body: data.body,
    icon: `${BASE}icons/icon-192.png`,
    badge: `${BASE}icons/icon-192.png`,
    tag: data.tag || 'stock-alert',
    data: { url: data.url || BASE },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Alerte Bourse', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || BASE;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
