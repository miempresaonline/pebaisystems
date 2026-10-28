/* PEBAI · Panel — service worker de los avisos (Web Push). No guarda nada en caché: el panel siempre se carga del servidor.
   El aviso llega vacío; aquí se pide su texto al panel enseñando la suscripción de este dispositivo (ver panel/_avisos_panel.php). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => e.waitUntil((async () => {
  let avisos = [];
  try {
    const sub = await self.registration.pushManager.getSubscription();
    const r = await fetch('./?avisos_sw=1', { method: 'POST', cache: 'no-store', credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ endpoint: sub ? sub.endpoint : '' }) });
    const j = await r.json();
    avisos = (j && j.avisos) || [];
  } catch (er) { /* sin red: aviso genérico */ }
  // El navegador exige enseñar algo en cada aviso
  if (!avisos.length) avisos = [{ id: 0, titulo: 'PEBAI', texto: 'Hay novedades en el panel.', ir: '' }];
  await Promise.all(avisos.map((a) => self.registration.showNotification(a.titulo, {
    body: a.texto || '', icon: 'assets/icono-192.png', badge: 'assets/favicon-32.png', tag: 'pebai-' + (a.id || Date.now()), data: { ir: a.ir || '' },
  })));
})()));

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const ir = (e.notification.data && e.notification.data.ir) || '';
  e.waitUntil((async () => {
    const lista = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierto = lista.find((c) => new URL(c.url).origin === self.location.origin);
    if (abierto) { await abierto.focus(); if (ir) abierto.postMessage({ pebaiIr: ir }); return; }
    await self.clients.openWindow('./' + (ir ? '?ir=' + encodeURIComponent(ir) : ''));
  })());
});
