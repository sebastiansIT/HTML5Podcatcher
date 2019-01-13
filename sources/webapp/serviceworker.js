/*  Copyright 2019 Sebastian Spautz

    This file is part of "HTML5 Podcatcher".

    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
*/
/* global self, caches, fetch */
/* Information about ServiceWorker see
   https://developers.google.com/web/fundamentals/primers/service-workers/ or
   https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate */

const CACHE_PREFIX = 'HTML5Podcatcher'
const CACHE_NAME = CACHE_PREFIX + '_{{ VERSION }}'
const CACHED_FILES = [
  // HTML
  'playlist.html',
  'sources.html',
  'source.html',
  'settings.html',
  // SCRIPTS
  'scripts/globalUi.js',
  'scripts/jquery.min.js',
  'scripts/lowLevelApi.js',
  'scripts/normalise.js',
  'scripts/playlist.js',
  'scripts/settings.js',
  'scripts/source.js',
  'scripts/sources.js',
  'scripts/configuration/configuration.js',
  'scripts/parser/parser.js',
  'scripts/parser/rss_2-0.js',
  'scripts/storage/storage.js',
  'scripts/storage/indexedDbProvider.js',
  'scripts/storage/fileSystemProvider.js',
  'scripts/storage/webStorageProvider.js',
  'scripts/web/web.js',
  // STYLESHEETS
  'styles/main.css',
  // ICONS
  'styles/icons/addSource.svg',
  'styles/icons/back.svg',
  'styles/icons/browsing.svg',
  'styles/icons/close.svg',
  'styles/icons/delete.svg',
  'styles/icons/download.svg',
  'styles/icons/notifications.svg',
  'styles/icons/pause.svg',
  'styles/icons/play.svg',
  'styles/icons/playlist.svg',
  'styles/icons/refresh.svg',
  'styles/icons/seekback.svg',
  'styles/icons/seekforward.svg',
  'styles/icons/settings.svg',
  'styles/icons/skipback.svg',
  'styles/icons/skipforward.svg',
  'styles/icons/sources.svg',
  // IMAGES
  'favicon.ico',
  'images/logo60.png',
  'images/logo76.png',
  'images/logo120.png',
  'images/logo152.png',
  'images/logo192.png'
]
const NETWORK_FILES = [
  'proxy.py',
  'sync.py'
]

self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache')
        return cache.addAll(CACHED_FILES)
      })
      .catch(error => {
        console.error('Error caching Files', error)
      })
  )
  console.log('ServiceWorker installed')
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Other Caches then the actual but in general a HTML5Podcatcher-Cache
          if (cacheName !== CACHE_NAME && cacheName.indexOf(CACHE_PREFIX) === 0) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  console.log('ServiceWorker activated')
})

self.addEventListener('fetch', event => {
  const SERVICEWORKER_SCOPE = self.registration.scope
  const SCOPE_URL = new URL(SERVICEWORKER_SCOPE)
  const FETCH_URL = new URL(event.request.url)

  // Check if file is on the "Not Cache list"
  if (NETWORK_FILES.find(noCachePath => {
    const NO_CACHE_URL = new URL(noCachePath, SERVICEWORKER_SCOPE)
    return NO_CACHE_URL.hostname === FETCH_URL.hostname &&
      NO_CACHE_URL.port === FETCH_URL.port &&
      NO_CACHE_URL.pathname === FETCH_URL.pathname
  })) {
    return // without a explicit call of event.respondWidth the browser handles the request as normal
  }

  // Respond primarly from cache; fallback to Network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response
        }

        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // If the requested file is in scope of the ServiceWorker cache the response
          if (SCOPE_URL.protocol === FETCH_URL.protocol &&
              SCOPE_URL.hostname === FETCH_URL.hostname &&
              SCOPE_URL.port === FETCH_URL.port &&
              FETCH_URL.pathname.indexOf(SCOPE_URL.pathname) === 0
          ) {
            let responseToCache = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              console.log('ServiceWorker fetches URL')
              cache.put(event.request, responseToCache)
            })
          }

          return response
        })
      })
  )
})
