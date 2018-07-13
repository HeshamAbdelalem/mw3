let staticCacheID = 'restaurant-static-cache-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheID).then(cache => {
            return cache.addAll([
                "/",
                "/index.html",
                "/restaurant.html",
                "/css/styles.css",
                "/data/restaurants.json",
                "/js/",
                "/js/dbhelper.js",
                "/js/main.js",
                "/js/restaurant_info.js",
                "/js/register.js",
                "/img/",
                "/img/1_1x.jpg",
                "/img/1_2x.jpg",
                "/img/2_1x.jpg",
                "/img/2_2x.jpg",
                "/img/3_1x.jpg",
                "/img/3_1x.jpg",
                "/img/4_1x.jpg",
                "/img/4_2x.jpg",
                "/img/5_1x.jpg",
                "/img/5_2x.jpg",
                "/img/6_1x.jpg",
                "/img/6_2x.jpg",
                "/img/7_1x.jpg",
                "/img/7_2x.jpg",
                "/img/8_1x.jpg",
                "/img/8_2x.jpg",
                "/img/9_1x.jpg",
                "/img/9_2x.jpg",
                "/img/10_1x.jpg",
                "/img/10_2x.jpg",

            ]).catch(error => {
                console.log("caches failed because " + error);
            });
        })
    );
});

self.addEventListener('fetch', event => {
    let cacheRequest = event.request;
    let cacheUrlObj = new URL(event.request.url);
    if (event.request.url.indexOf("restaurant.html") > -1) {
        const cacheURL = 'restaurant.html';
        cacheRequest = new Request(cacheURL);
    }
    if (cacheUrlObj.hostname !== "localhost") {
        event.request.mode = 'no-cors';
    }

    event.respondWith(
        caches.match(cacheRequest).then(response => {
            return (
                response ||
                fetch(event.request).then(fetchResponse => {
                    return caches.open(staticCacheID).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                }).catch(error => {
                    if (event.request.url.indexOf > -1) {
                        return caches.match('/img/*.jpg');
                    }
                    return new Response('The App cannot reach internet', ({
                        status: 404,
                        statusText: 'The App cannot reach internet'
                    }));
                })
            );
        })
    );
});