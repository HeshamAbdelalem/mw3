function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  return idb.open('restaurantsDB', 1, (upgradeDb) => {
    let store = upgradeDb.createObjectStore('restaurant-review', {
      keyPath: 'id'
    });
  });
}

function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  return idb.open('restaurantsDB', 2, (upgradeDb) => {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      case 1:
        const reviewsStore = upgradeDb.createObjectStore('reviews',{
          keypath: 'id'
        });
        reviewsStore.createIndex('restaurant', 'restaurant_id');
    }
  });
}



function addRestaurantsToCache(restaurants) {
  openDatabase().then((db) => {
    if (!db) return;

    let tx = db.transaction('restaurant-review', 'readwrite');
    let store = tx.objectStore('restaurant-review');

    if (restaurants.length === undefined) {
      store.put(restaurants);
    } else {
      restaurants.forEach((restaurant) => {
        store.put(restaurant);
      });
    }
    return tx.complete;
  });
}


function showCachedRestaurants() {
  return openDatabase().then((db) => {
    let tx = db.transaction('restaurant-review');
    let store = tx.objectStore('restaurant-review');
    return store.getAll();

  }).then((restaurants) => {
    return restaurants;
  });
}


function showCachedRestaurant(id) {
  return openDatabase().then((db) => {
    let tx = db.transaction('restaurant-review');
    let store = tx.objectStore('restaurant-review');
    id = parseInt(id);

    return store.get(id);
  }).then((restaurant) => {
    console.log(restaurant);
    return restaurant;
  });
}
/*
function showFavRestaurants() {
  return openDatabase().then((db) => {
    let tx = db.transaction('restaurantsfav', 'readwrite');
    let store = tx.objectStore('restaurantsfav');

    return store.get(restaurantId)
    .then(restaurant => {
      return store.put(restaurant);
    });
  });
}
*/
openDatabase();