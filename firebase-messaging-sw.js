/* ============================================================================
 * RBVFC Member LOSAP Portal — Service Worker
 * File location on GitHub: /rbvfc-portal.html/firebase-messaging-sw.js
 *
 * Responsibilities:
 *   1. Firebase Cloud Messaging — receive & display background push notifications
 *   2. Cache control — make sure devices ALWAYS get the freshest portal HTML
 *      (network-first for navigations) instead of being pinned to a stale copy.
 *
 * Why this file matters for "changes not showing up":
 *   A registered service worker controls every page in its scope. Without an
 *   explicit fetch strategy, browsers can keep serving an old copy of the app
 *   from cache/SW lifecycle, which is why updates appeared on some devices but
 *   not others. The skipWaiting()/clients.claim() + network-first logic below
 *   forces each device to pick up the newest version on next load.
 *
 * IMPORTANT: bump SW_VERSION on every deploy of THIS file. Changing the string
 * is the signal the browser uses to install the new SW and purge old caches.
 * ==========================================================================*/

const SW_VERSION = 'rbvfc-sw-v1';          // ← bump this each time you edit this file
const HTML_CACHE = SW_VERSION + '-html';

// ── Firebase Cloud Messaging ────────────────────────────────────────────────
// compat SDKs are required inside a (non-module) service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDx14iFA-z_N3_XTGdp7WRpPhBseSwNnmc",
  authDomain:        "rbvfc-losap.firebaseapp.com",
  projectId:         "rbvfc-losap",
  storageBucket:     "rbvfc-losap.firebasestorage.app",
  messagingSenderId: "782412260564",
  appId:             "1:782412260564:web:a8669ef676216300480741"
});

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  // Messaging may be unsupported in some browsers — push just won't fire.
  // The cache-control half of this SW still works regardless.
}

if (messaging) {
  messaging.onBackgroundMessage(function (payload) {
    const n = (payload && payload.notification) || {};
    const title = n.title || 'Riviera Beach VFC';
    const options = {
      body:  n.body || '',
      icon:  n.icon || '/rbvfc-portal.html/icon-192.png',
      badge: '/rbvfc-portal.html/icon-192.png',
      data:  (payload && payload.data) || {},
      tag:   (payload && payload.data && payload.data.tag) || undefined
    };
    self.registration.showNotification(title, options);
  });
}

// Focus / open the portal when a notification is clicked.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const target = '/rbvfc-portal.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const client of list) {
        if (client.url.indexOf('/rbvfc-portal.html') !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

// ── Lifecycle: take control immediately so updates land on next load ─────────
self.addEventListener('install', function (event) {
  // Don't sit in the "waiting" state behind the old SW — activate right away.
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async function () {
      // Purge any HTML caches from previous SW versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(function (k) { return k !== HTML_CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
      // Start controlling already-open tabs without requiring a manual reload.
      await self.clients.claim();
    })()
  );
});

// ── Fetch: NETWORK-FIRST for page navigations (the portal HTML) ──────────────
// Always try the live network copy first so a fresh deploy shows up immediately.
// Only fall back to the cached copy when the device is genuinely offline.
self.addEventListener('fetch', function (event) {
  const req = event.request;

  // Only intervene for top-level navigations (HTML document loads).
  const isNavigation =
    req.mode === 'navigate' ||
    (req.method === 'GET' &&
     req.headers.get('accept') &&
     req.headers.get('accept').indexOf('text/html') !== -1);

  if (!isNavigation) return; // let everything else (Firebase, fonts, etc.) pass through untouched

  event.respondWith(
    (async function () {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        // Stash a copy for offline fallback.
        try {
          const cache = await caches.open(HTML_CACHE);
          cache.put(req, fresh.clone());
        } catch (e) { /* caching is best-effort */ }
        return fresh;
      } catch (err) {
        // Offline — serve the last good copy if we have one.
        const cached = await caches.match(req);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});

// Allow the page to tell a waiting SW to activate immediately (optional hook).
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
