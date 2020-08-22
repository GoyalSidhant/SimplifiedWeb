'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "index.html": "7776b03a9d104bf355aae0a54448c051",
"/": "7776b03a9d104bf355aae0a54448c051",
"main.dart.js": "73fdd3c6bce82ebc4d90e8d82b1416a3",
"favicon.png": "ae0b20efce470a0206e1ec7f13d09fa8",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "e5a385b0693397a4f8273f383167669c",
"assets/AssetManifest.json": "00226b276ab9925572fb0b7ce44f6c7c",
"assets/NOTICES": "5a5fb5a427c99c3468caafe75d523cd1",
"assets/FontManifest.json": "cb166fecf7e7b32e1c237c7a59afe78e",
"assets/packages/line_icons/lib/assets/fonts/LineIcons.ttf": "8d0d74fa070d25f1d57e29df18800b8a",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/packages/time_machine/data/cultures/cultures.bin": "819290dd4e32d87dd57cfb2babe7a18b",
"assets/packages/time_machine/data/tzdb/tzdb.bin": "e92d413816327a07cb5a1789ba8971d1",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/assets/images/no_subject.png": "cae250e0d10084f7c08ba633337c3319",
"assets/assets/images/topBarCircle.png": "5f4b074de6873785f5dce9adf977ef8d",
"assets/assets/images/login_bg.png": "6c9ca30c3685e79e84ee40e551bbfb16",
"assets/assets/images/zoom.png": "23ee6d831db2e8dc63f42941d593b1c9",
"assets/assets/images/result.png": "2c365788db3bda529d0913eb7bd18ac5",
"assets/assets/images/no_classes.png": "fdfbb39bf6e80ca5a816e90ea762222e",
"assets/assets/images/app_logo.png": "ae0b20efce470a0206e1ec7f13d09fa8",
"assets/assets/images/tiet_iconic_girls.jpg": "9e5571fae83909b1eb6d5a1e635d059f",
"assets/assets/opencv.css": "1cd07ba0561c978a1a30bf3b61c56ef6",
"assets/assets/opencv.html": "1c47286587aefc4cc2930c738449caf4",
"assets/assets/opencv-demo.js": "d090f865859ec051749c2843f0dd41d8",
"assets/assets/fonts/Karla-Italic.ttf": "740dfd331d76c6cd37793423cb1e0cad",
"assets/assets/fonts/Circular-Std-Book.ttf": "860c3ec7bbc5da3e97233ccecafe512e",
"assets/assets/fonts/Karla-Regular.ttf": "1b55fee684d61bfeaa762684931b1bc9",
"assets/assets/fonts/Karla-BoldItalic.ttf": "ebf98a26db2e0ccb66cd970557a51248",
"assets/assets/fonts/Karla-Bold.ttf": "c07c916c55ef23e1f0a0dbcb10b9aaae"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a no-cache param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'no-cache'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'no-cache'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message === 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
