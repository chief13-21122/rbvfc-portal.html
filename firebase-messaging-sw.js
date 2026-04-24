// ══════════════════════════════════════════════════════════════
//  Co.13 Portal — Firebase Messaging Service Worker
//  Path on server:  /rbvfc-portal.html/firebase-messaging-sw.js
//  Lives in repo at the same relative path as rbvfc-portal.html
// ══════════════════════════════════════════════════════════════

// ── Firebase SDK (compat build — matches the main portal) ─────────────
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ── Firebase config (must match the baked-in values in the portal) ────
firebase.initializeApp({
  apiKey:            "AIzaSyDx14iFA-z_N3_XTGdp7WRpPhBseSwNnmc",
  authDomain:        "rbvfc-losap.firebaseapp.com",
  projectId:         "rbvfc-losap",
  storageBucket:     "rbvfc-losap.firebasestorage.app",
  messagingSenderId: "782412260564",
  appId:             "1:782412260564:web:a8669ef676216300480741"
});

var messaging = firebase.messaging();

// ── Branding URLs ─────────────────────────────────────────────────────
// These MUST be same-origin URLs (commit the PNGs to your repo).
// Absolute paths so Chrome resolves them correctly no matter where the
// notification is delivered.
var LOGO_ICON  = '/rbvfc-portal.html/logo-192.png';   // 192×192 color PNG — main notification icon
var LOGO_BADGE = '/rbvfc-portal.html/badge-72.png';   // 72×72 monochrome transparent PNG — Android status bar
var LOGO_IMAGE = '/rbvfc-portal.html/logo-512.png';   // optional 512×512 large image (shown below text on some platforms)

// ══════════════════════════════════════════════════════════════════════
//  BACKGROUND MESSAGE HANDLER
//  Fires only when the message is data-only (no `notification` block).
//  The companion Apps Script change sends data-only payloads so this
//  handler controls how every notification looks.
// ══════════════════════════════════════════════════════════════════════
messaging.onBackgroundMessage(function(payload) {
  var d = payload.data || {};
  var title = d.title || 'Co.13 Alert';
  var body  = d.body  || '';

  var options = {
    body:  body,
    icon:  LOGO_ICON,
    badge: LOGO_BADGE,
    tag:   d.alertId || ('co13_' + Date.now()),  // collapses duplicates
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url:     d.url     || '/rbvfc-portal.html/',
      alertId: d.alertId || ''
    }
  };

  // Only add `image` if you've uploaded logo-512.png. Comment out the
  // next line if you haven't.
  // options.image = LOGO_IMAGE;

  return self.registration.showNotification(title, options);
});

// ══════════════════════════════════════════════════════════════════════
//  CLICK HANDLER — focus existing tab or open portal
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/rbvfc-portal.html/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If the portal is already open in a tab, focus it
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf('rbvfc-portal') > -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ══════════════════════════════════════════════════════════════════════
//  Optional: lifecycle — activate immediately on update
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('install',  function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });
