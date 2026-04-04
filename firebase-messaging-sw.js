// firebase-messaging-sw.js
// Riviera Beach Volunteer Fire Company — Co.13 Portal
//
// IMPORTANT: This file must be placed in the ROOT of the rbvfc-portal.html
// GitHub repository (same folder as rbvfc-portal.html).
// URL it must be reachable at:
// https://chief13-21122.github.io/rbvfc-portal.html/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDx14iFA-z_N3_XTGdp7WRpPhBseSwNnmc",
  authDomain:        "rbvfc-losap.firebaseapp.com",
  projectId:         "rbvfc-losap",
  storageBucket:     "rbvfc-losap.firebasestorage.app",
  messagingSenderId: "782412260564",
  appId:             "1:782412260564:web:a8669ef676216300480741"
});

const messaging = firebase.messaging();

// Background message handler — fires when the portal is closed or in background
messaging.onBackgroundMessage(function(payload) {
  console.log('[RBVFC SW] Background message received:', payload);

  const title = (payload.notification && payload.notification.title) || 'Co.13 Alert';
  const body  = (payload.notification && payload.notification.body)
             || (payload.data && payload.data.msg)
             || '';
  const icon  = (payload.notification && payload.notification.icon)
             || '/rbvfc-portal.html/icon-192.png';
  const url   = (payload.data && payload.data.url) || '/rbvfc-portal.html/rbvfc-portal.html';

  const options = {
    body:    body,
    icon:    icon,
    badge:   '/rbvfc-portal.html/icon-96.png',
    vibrate: [200, 100, 200],
    data:    { url: url },
    actions: [
      { action: 'open',    title: 'Open Portal' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(title, options);
});

// Click handler — opens the portal when notification is tapped
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var url = (event.notification.data && event.notification.data.url)
          || '/rbvfc-portal.html/rbvfc-portal.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If portal is already open, focus it
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf('rbvfc-portal') >= 0 && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
