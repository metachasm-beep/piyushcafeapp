/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

// ─── Cache Names ─────────────────────────────────────────────
const CACHE_NAME = `golden-fork-v${version}`;
const STATIC_ASSETS = [...build, ...files];

// ─── Install: Pre-cache App Shell ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: Delete Old Caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      for (const key of keys) {
        if (key !== CACHE_NAME) await caches.delete(key);
      }
      await self.clients.claim();
    })
  );
});

// ─── Fetch: Network-First for API, Cache-First for Assets ────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // For navigation requests (HTML pages): network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((r) => r ?? caches.match('/'))
      ) as Promise<Response>
    );
    return;
  }

  // For static assets in build/files: cache-first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request)
      ) as Promise<Response>
    );
    return;
  }

  // For food images from external CDN (Unsplash, etc.): stale-while-revalidate
  if (url.hostname.includes('unsplash') || url.hostname.includes('images')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached ?? networkFetch;
      }) as Promise<Response>
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)) as Promise<Response>
  );
});

// ─── Push Notifications (future) ─────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Golden Fork', {
      body: data.body ?? 'You have a new notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  );
});
