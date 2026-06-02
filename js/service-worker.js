/* service-worker.js - S1N Offline Capability (Animation Update) */

const CACHE_NAME = 's1n-productive-v5'; // Version bumped for Animation System

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pomodoro.js',
  './manifest.json',
  './auth.js',
  './social.js',
  './notifications.js',
  './profile.js',
  './reports.js',
  './shop.js',
  './chat.js',          
  './achievements.js',
  './onboarding.js',
  
  // Assets
  './assets/122393.jpg', 
  './assets/122395.jpg', 
  './assets/122397.jpg', 
  './assets/122399.jpg', 
  './assets/122401.jpg', 
  './assets/122405.jpg', 
  './assets/122407.jpg', 
  './assets/122409.jpg', 
  './assets/122411.jpg', 
  './assets/122413.jpg', 
  
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// 1. INSTALL
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. ACTIVATE
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. FETCH
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;
                return fetch(event.request);
            })
    );
});
