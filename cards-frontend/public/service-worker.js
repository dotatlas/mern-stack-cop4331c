self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[Service Worker] Invalid push payload:', error);
    return;
  }

  const reminderId = data.data?.reminderId;
  event.waitUntil(
    self.registration.showNotification(data.title || 'Calendar Reminder', {
      body: data.body || 'You have a reminder.',
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: data.data || { url: '/dashboard' },
      tag: reminderId
        ? `reminder-${reminderId}-${data.data?.fiveMinutesBefore ? 'early' : 'due'}`
        : undefined,
      renotify: false
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          return typeof client.navigate === 'function' ? client.navigate(target) : client;
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
