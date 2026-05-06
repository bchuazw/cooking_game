self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const scope = self.registration.scope.toLowerCase();
    const shouldDelete = (key) => {
      const n = key.toLowerCase();
      return n.includes('workbox') || n.includes('precache') || n.includes('hawker') || n.includes('cooking_game') || n.includes(scope);
    };
    const keys = await caches.keys();
    await Promise.all(keys.filter(shouldDelete).map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map((client) => client.navigate(client.url)));
  })());
});
