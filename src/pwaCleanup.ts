const CLEANUP_KEY = 'hawker-mama:legacy-sw-cleanup:v1';

function shouldDeleteCache(name: string, base: string) {
  const n = name.toLowerCase();
  return n.includes('workbox') || n.includes('precache') || n.includes('hawker') || n.includes(base.replace(/\//g, ''));
}

export function cleanupLegacyServiceWorker(base: string) {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const run = async () => {
    const alreadyReloaded = localStorage.getItem(CLEANUP_KEY) === 'reloaded';

    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const scoped = regs.filter((reg) => reg.scope.includes(base));
      await Promise.all(scoped.map((reg) => reg.unregister()));
    } catch {
      // Best-effort cleanup only.
    }

    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => shouldDeleteCache(key, base)).map((key) => caches.delete(key)));
      } catch {
        // Cache APIs may be unavailable in private browsing.
      }
    }

    if (navigator.serviceWorker.controller && !alreadyReloaded) {
      localStorage.setItem(CLEANUP_KEY, 'reloaded');
      window.location.reload();
      return;
    }

    if (!alreadyReloaded) localStorage.setItem(CLEANUP_KEY, 'done');
  };

  window.addEventListener('load', () => {
    void run();
  }, { once: true });
}
