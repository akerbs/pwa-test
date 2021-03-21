const staticCacheName = "s-app-v3";
const dynamicCacheName = "d-app-v3";

// all static files will be added  to cache
const assetUrls = [
  "index.html",
  "/js/app.js",
  "/css/styles.css",
  "offline.html",
];

self.addEventListener("install", async (event) => {
  // console.log("[SW]: install");
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls);

  // event.waitUntil(
  //   caches.open(staticCacheName).then((cache) => cache.addAll(assetUrls))
  // );
});

self.addEventListener("activate", async (event) => {
  // delete previous cahce version (in order to refresh app)
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== staticCacheName)
      .filter((name) => name !== dynamicCacheName)
      .map((name) => caches.delete(name))
  );
  // console.log("[SW]: activate");
});

// by any requerst from app  (to static files as well)
self.addEventListener("fetch", (event) => {
  // console.log("Fetch", event.request.url);
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? (await fetch(request));
}

async function networkFirst(request) {
  const cache = await caches.open(dynamicCacheName);
  try {
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    return cached ?? (await caches.match("/offline.html"));
  }
}
