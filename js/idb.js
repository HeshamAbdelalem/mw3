openDatabase()
  .then( addRestaurantsToCache() )
  .then( showCachedRestaurants() )
  .then( showCachedRestaurants() )
  .catch((err) => console.log(`there is an  ${err}`) );

function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  return idb.open('restaurantsDB', 1, (upgradeDb) => {
    let store = upgradeDb.createObjectStore('restaurant', { keyPath: 'id' });
  });
}

function addRestaurantsToCache(restaurants) {
  openDatabase().then( (db) => {
    if (!db) return;

    let tx = db.transaction('restaurant', 'readwrite');
    let store = tx.objectStore('restaurant');

    if(restaurants.length == undefined){
    	store.put(restaurants);
    }else{
    restaurants.forEach( (restaurant) => {
      store.put(restaurants);
    });
	}
    return tx.complete;
  });
}


function showCachedRestaurants() {
  return openDatabase().then( (db) => {
    let tx = db.transaction('restaurants');
    let store = tx.objectStore('restaurants');
    return store.getAll();

  }).then( (restaurants) => {
    return restaurants;
  });
}


function showCachedRestaurant(id) {
  return openDatabase().then( (db) => {
    let tx = db.transaction('restaurant');
    let store = tx.objectStore('restaurant');
    id = parseInt(id);

    return store.get(id);
  }).then( (restaurant) => {
    console.log(restaurant);
    return restaurant;
  });
}