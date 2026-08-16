/* Basic service worker for FCM background messages.
   This file receives push events and shows notifications. For a production
   setup use Firebase Messaging's recommended service worker initialization
   with your project's firebaseConfig and the compat libraries if needed.
*/

self.addEventListener('push', function (event) {
  try {
    const data = event.data ? event.data.json() : {}
    const title = data.notification?.title || data.title || 'KhetConnect'
    const body = data.notification?.body || data.body || ''
    const options = {
      body: body,
      data: data.data || {},
      tag: data.notification?.tag || undefined,
    }
    event.waitUntil(self.registration.showNotification(title, options))
  } catch (e) {
    // fallback: show generic notification
    event.waitUntil(self.registration.showNotification('KhetConnect', { body: 'You have a new notification' }))
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const urlToOpen = event.notification?.data?.url || '/' 
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
