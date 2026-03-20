// Minimal service worker for PWA installation support
const CACHE_NAME = 'minimal-todo-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Pass-through for now, required by Chrome for PWA criteria
  event.respondWith(fetch(event.request));
});
