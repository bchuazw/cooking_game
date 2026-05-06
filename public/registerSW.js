if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const shouldDelete = (key) => {
      const n = key.toLowerCase();
      return n.includes('workbox') || n.includes('precache') || n.includes('hawker') || n.includes('cooking_game');
    };

    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.filter((reg) => reg.scope.includes('/cooking_game/')).map((reg) => reg.unregister()));
    } catch {}

    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter(shouldDelete).map((key) => caches.delete(key)));
      } catch {}
    }
  });
}
