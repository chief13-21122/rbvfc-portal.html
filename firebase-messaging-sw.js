// ══════════════════════════════════════════════════════════════
//  Co.13 Portal — Firebase Messaging Service Worker
//  Path on server:  /rbvfc-portal.html/firebase-messaging-sw.js
//  Lives in repo at the same relative path as rbvfc-portal.html
// ══════════════════════════════════════════════════════════════

// ── Firebase SDK (compat build — matches the main portal) ─────────────
// firebase-messaging-sw.js — Co.13 Portal
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDx14iFA-z_N3_XTGdp7WRpPhBseSwNnmc",
  authDomain: "rbvfc-losap.firebaseapp.com",
  projectId: "rbvfc-losap",
  storageBucket: "rbvfc-losap.firebasestorage.app",
  messagingSenderId: "782412260564",
  appId: "1:782412260564:web:a8669ef676216300480741"
});

var messaging = firebase.messaging();

// Use the committed PNG; fall back to a payload-supplied icon if present
var DEFAULT_ICON = '/rbvfc-portal.html/notification-icon.png';

messaging.onBackgroundMessage(function(payload) {
  var n = payload.notification || {};
  var d = payload.data || {};
  var title = n.title || d.title || 'Co.13 Alert';
  var body  = n.body  || d.body  || d.msg || '';
  var icon  = d.icon  || n.icon  || DEFAULT_ICON;

  return self.registration.showNotification(title, {
    body: body,
    icon: icon,
    badge: icon,
    tag: 'co13-' + (d.alertId || Date.now()),
    data: d
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/rbvfc-portal.html/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(url) !== -1 && 'focus' in list[i]) return list[i].focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
// ══════════════════════════════════════════════════════════════════════
//  Optional: lifecycle — activate immediately on update
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('install',  function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });
