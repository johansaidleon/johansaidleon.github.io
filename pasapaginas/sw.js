/* Service worker: guarda la app en el dispositivo para que abra sin internet.
   Sube VERSION cada vez que cambies cualquier archivo de esta carpeta, o los
   dispositivos que ya la instalaron seguirán viendo la versión anterior. */
const VERSION = 'v4';
const CACHE = 'pasapaginas-' + VERSION;

const CORE = [
  './',
  'index.html',
  'ayuda.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'vendor/pdf.min.js',
  'vendor/pdf.worker.min.js',
  'vendor/page-flip.browser.js',
  'fonts/cormorant-garamond-latin-600-italic.woff2',
  'fonts/cormorant-garamond-latin-600-normal.woff2',
  'fonts/cormorant-garamond-latin-700-normal.woff2',
  'fonts/instrument-sans-latin-400-normal.woff2',
  'fonts/instrument-sans-latin-500-normal.woff2',
  'fonts/instrument-sans-latin-600-normal.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'vendor/standard_fonts/FoxitDingbats.pfb',
  'vendor/standard_fonts/FoxitFixed.pfb',
  'vendor/standard_fonts/FoxitFixedBold.pfb',
  'vendor/standard_fonts/FoxitFixedBoldItalic.pfb',
  'vendor/standard_fonts/FoxitFixedItalic.pfb',
  'vendor/standard_fonts/FoxitSerif.pfb',
  'vendor/standard_fonts/FoxitSerifBold.pfb',
  'vendor/standard_fonts/FoxitSerifBoldItalic.pfb',
  'vendor/standard_fonts/FoxitSerifItalic.pfb',
  'vendor/standard_fonts/FoxitSymbol.pfb',
  'vendor/standard_fonts/LICENSE_FOXIT',
  'vendor/standard_fonts/LICENSE_LIBERATION',
  'vendor/standard_fonts/LiberationSans-Bold.ttf',
  'vendor/standard_fonts/LiberationSans-BoldItalic.ttf',
  'vendor/standard_fonts/LiberationSans-Italic.ttf',
  'vendor/standard_fonts/LiberationSans-Regular.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pasapaginas-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      // Mapas de caracteres de pdf.js (PDF en chino, japonés, coreano...): se guardan al usarse por primera vez.
      return fetch(req).then((res) => {
        if (res.ok && url.pathname.includes('/vendor/cmaps/')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    })
  );
});
