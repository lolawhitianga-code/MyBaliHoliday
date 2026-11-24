/* My Bali Holiday — offline shell.
   Bump CACHE when you change a page and want everyone to pick it up. */

const CACHE = "mbh-v76";

const SHELL = [
  "./",
  "./index.html",
  "./home.html",
  "./kylie.html",
  "./planner.html",
  "./flights.html",
  "./stays.html",
  "./money.html",
  "./photos.html",
  "./before.html",
  "./emergency.html",
  "./shopping.html",
  "./packing.html",
  "./ideas.html",
  "./admin.html",
  "./bookies.html",
  "./nz-2026-election-quiz.html",
  "./icon-100-note.jpg",
  "./setup-tracker.html",
  "./sameday-advance-console.html",
  "./stars.html",
  "./stars.js",
  "./hero-home.jpg",
  "./hero-photos.jpg",
  "./hero-stays.jpg",
  "./hero-planner.jpg",
  "./hero-packing.jpg",
  "./hero-ideas.jpg",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// live data must never be served from cache
const LIVE = [
  "firestore.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "firebase",
  "open.er-api.com"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("mbh-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (LIVE.some(h => url.hostname.includes(h))) return;

  // The casino (/Casino/) and the Xmas app (/xmas/) are separate sites that upload on their own.
  // Leave their files alone: serving old saved copies of them froze the casino games on phones.
  if (url.origin === location.origin && /^\/(casino|xmas)\//i.test(url.pathname)) return;

  const wantsPage = req.mode === "navigate" ||
                    (req.headers.get("accept") || "").includes("text/html");

  // pages: fresh if we can reach the network, cached if we can't
  if (wantsPage) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        (await caches.open(CACHE)).put(req, res.clone());
        return res;
      } catch (err) {
        return (await caches.match(req)) || (await caches.match("./index.html"));
      }
    })());
    return;
  }

  // fonts, icons, everything else: cached if we have it
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      const keep = url.origin === location.origin ||
                   url.hostname.endsWith("gstatic.com") ||
                   url.hostname === "fonts.googleapis.com";
      if (res.ok && keep) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
