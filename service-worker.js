const CACHE_NAME = 'weekly-reports-v12';
const APP_SHELL = [
  './','./index.html','./employee.html','./admin.html','./manager.html',
  './css/variables.css','./css/theme.css','./css/animations.css','./css/login.css','./css/login-modern.css','./css/employee.css','./css/employee-modern.css','./css/employee-v4.css','./css/employee-dashboard.css','./css/employee-layout-fix.css','./css/dialogs.css','./css/employee-pdf-modal.css','./css/logout-modal.css','./css/pwa.css',
  './js/config.js','./js/storage.js','./js/api.js','./js/auth.js','./js/employee.js','./js/employee-pdf-viewer.js','./js/employee-dashboard.js','./js/dialogs.js','./js/logout-modal.js','./js/pwa.js',
  './assets/logo.png','./assets/login-bg.svg','./manifest.webmanifest'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;if(event.request.mode==='navigate'||url.pathname.endsWith('.html')){event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));return}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return response}))) });
