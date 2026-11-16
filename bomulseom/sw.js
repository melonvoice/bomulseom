// 앱 설치용 서비스 워커 – 아무것도 저장하지 않고 항상 최신 파일을 받아요.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request)); });
