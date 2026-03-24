// Firebase Cloud Messaging Service Worker
// This file must be at the root of your domain (public/).
importScripts(
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js',
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js',
)

// Firebase config is injected at runtime via postMessage or hardcoded here.
// For the pilot, use environment-specific build step or inline config.
const firebaseConfig = self.__FIREBASE_CONFIG__ ?? {}

if (Object.keys(firebaseConfig).length > 0) {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const { title = 'New High-Priority Lead', body = '' } =
      payload.notification ?? {}
    const leadId = payload.data?.leadId

    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { leadId },
    })
  })

  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const leadId = event.notification.data?.leadId
    const url = leadId ? `/agent/leads/${leadId}` : '/agent'
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              void client.focus()
              void client.navigate(url)
              return
            }
          }
          return clients.openWindow(url)
        }),
    )
  })
}
