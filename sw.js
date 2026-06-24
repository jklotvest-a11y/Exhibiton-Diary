// 看展日记 · Service Worker
// v3 - 缓存所有静态资源 + 自动清旧版本

const CACHE_NAME = 'kanzhan-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/storage.js',
  './js/router.js',
  './js/data-seed.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

// 安装：缓存所有静态资源，失败也不阻塞
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 缓存资源');
      // 用 addAll 失败会回退逐个 add，单个失败不阻塞其它
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(err => console.warn('[SW] cache miss:', url, err)))
      );
    })
  );
  self.skipWaiting();
});

// 激活：清掉所有不是当前 CACHE_NAME 的旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[SW] 删除旧缓存', k);
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求：缓存优先，离线可用
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        // 缓存新资源（同源才缓存）
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      }).catch(() => {
        // 离线 fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});