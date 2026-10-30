// Service worker: keeps the course working offline.
// - First visit: saves only the small core (session pages, styles, logo).
// - Anything opened afterwards (workbooks, 3D labs, guides) is saved as it is used.
// - The "Save the whole course" button on the Mentors page saves everything,
//   so a lab PC works with no internet at all.
// The build fills in VERSION, CORE and ALL. A new build gets a new cache, but
// keeps the old saved copies until fresh ones arrive, so offline PCs never lose them.
const VERSION = '__VERSION__';
const CORE = __CORE__;
const ALL = __ALL__;
const CACHE = `bih-${VERSION}`;
const FULL_MARK = '/__saved-whole-course__';

// Add files one by one, so one failed download on a weak connection doesn't undo the rest.
async function addEach(cache, urls, onProgress) {
  let done = 0;
  let failed = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      await cache.put(url, res);
    } catch {
      failed++;
    }
    onProgress?.(++done, urls.length, failed);
  }
  return failed;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => addEach(c, CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let wasFull = false;
    for (const name of await caches.keys()) {
      if (!name.startsWith('bih-') || name === CACHE) continue;
      const old = await caches.open(name);
      if (await old.match(FULL_MARK)) wasFull = true;
      // Carry over anything the new version doesn't have yet (and still uses).
      for (const req of await old.keys()) {
        const path = new URL(req.url).pathname;
        if (ALL.includes(path) && !(await cache.match(req))) await cache.put(req, await old.match(req));
      }
      await caches.delete(name);
    }
    await self.clients.claim();
    // This PC had the whole course saved: refresh it in the background.
    if (wasFull) {
      await cache.put(FULL_MARK, new Response(VERSION));
      addEach(cache, ALL);
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data !== 'save-all') return;
  const client = event.source;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const failed = await addEach(cache, ALL, (done, total, failed) => client?.postMessage({ type: 'save-progress', done, total, failed }));
    if (!failed) await cache.put(FULL_MARK, new Response(VERSION));
    client?.postMessage({ type: 'save-done', failed, total: ALL.length });
  })());
});

const timeout = (ms) => new Promise((_, reject) => setTimeout(reject, ms));
const saveCopy = (request, res) => {
  if (res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(request, copy));
  }
  return res;
};
// Offline, "/sessions/01" should find the saved "/sessions/01/".
async function savedCopy(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const url = new URL(request.url);
  if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) {
    return caches.match(url.pathname + '/');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('.zip')) return; // big downloads go straight to the network

  // three.js sits in a versioned folder and never changes: saved copy first.
  // Pictures and PDFs: saved copy first too.
  if (url.pathname.startsWith('/vendor/') || /\.(png|jpe?g|svg|pdf|webmanifest|woff2)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => saveCopy(request, res))));
    return;
  }

  // Pages, styles and lab code: try the network so updates arrive together,
  // but give up after 4 seconds on a slow connection and use the saved copy.
  event.respondWith(
    Promise.race([fetch(request), timeout(4000)])
      .then((res) => saveCopy(request, res))
      .catch(async () => (await savedCopy(request)) || (request.mode === 'navigate' ? caches.match('/404.html') : Response.error())),
  );
});
