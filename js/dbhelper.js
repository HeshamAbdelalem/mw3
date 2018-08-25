/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }


  /**
   * Fetch all restaurants.
   */

  static dbPromise() {
    return idb.open('db', 2, function (upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          const reviewsStore = upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
          reviewsStore.createIndex('restaurant', 'restaurant_id');
      }
    });
  }

  static fetchRestaurants() {
    return this.dbPromise()
      .then(db => {
        const tx = db.transaction('restaurants');
        const restaurantStore = tx.objectStore('restaurants');
        return restaurantStore.getAll();
      })
      .then(restaurants => {
        if (restaurants.length !== 0) {
          return Promise.resolve(restaurants);
        }
        return this.fetchAndCacheRestaurants();
      });
  }

  static fetchAndCacheRestaurants() {
    return fetch(DBHelper.DATABASE_URL + 'restaurants')
      .then(response => response.json())
      .then(restaurants => {
        return this.dbPromise()
          .then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantStore = tx.objectStore('restaurants');
            restaurants.forEach(restaurant => restaurantStore.put(restaurant));

            return tx.complete.then(() => Promise.resolve(restaurants));
          });
      });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.find(r => r.id === id));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.filter(r => r.cuisine_type === cuisine));

  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => restaurants.filter(r => r.neighborhood === neighborhood));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        return uniqueNeighborhoods;
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        return uniqueCuisines;
      });
  }


  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    });
    marker.addTo(newMap);
    return marker;
  }


  static updateFavouriteStatus(restaurantId, isFavourite) {
    console.log('changing status to: ', isFavourite);

    fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavourite}`, {
        method: 'PUT'
      })
      .then(() => {
        console.log('changed the fav status');
        this.dbPromise()
          .then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const restaurantsStore = tx.objectStore('restaurants');
            restaurantsStore.get(restaurantId)
              .then(restaurant => {
                restaurant.is_favorite = isFavourite;
                restaurantsStore.put(restaurant);
              });
          });
      });

  }

  // HANDLE The Review logic

  static addReview(review) {
    let offline_obj = {
      name: 'addReview',
      data: review,
      object_type: 'review'
    };
    // check if online
    if (!navigator.onLine && (offline_obj.name === 'addReview')) {
      DBHelper.sendDataWhenOnline(offline_obj);
      return;
    }
    let reviewSend = {
      "name": review.name,
      "rating": parseInt(review.rating),
      "comments": review.comments,
      "restaurant_id": parseInt(review.restaurant_id)
    };
    console.log('sending review: ', reviewSend);
    var fetch_options = {
      method: 'POST',
      body: JSON.stringify(reviewSend),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    };
    fetch(`http://localhost:1337/reviews`, fetch_options).then((response) => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          return response.json();
        } else {
          return 'API call successfull';
        }
      })
      .then((data) => {
        console.log(`Fetch successfull!`);
      })
      .catch(error => console.log('error: ', error));
  }

  // SEND data when Online

  static sendDataWhenOnline(offline_obj) {
    console.log('Offline OBJ', offline_obj);
    localStorage.setItem('data', JSON.stringify(offline_obj.data)); //store the review locally
    console.log(`Local Storage: ${offline_obj.object_type} stored`);

    window.addEventListener('online', (event) => { // waiting for back online
      console.log('Browser is Online again!');
      let data = JSON.parse(localStorage.getItem('data'));
      console.log('updating and cleaning ui');
      [...document.querySelectorAll(".reviews_offline")].forEach(el => { // update the UI
        el.classList.remove("reviews_offline");
        el.querySelector(".offline_label").remove();
      });

      if (data !== null) {
        console.log(data);
        if (offline_obj.name === 'addReview') {
          DBHelper.addReview(offline_obj.data); // send the review to the server
        }

        console.log('LocalState: data sent to api');

        localStorage.removeItem('data'); // remove the review locally
        console.log(`Local Storage: ${offline_obj.object_type} removed`);
      }
    });
  }




  /*
   * The Review Fetch Section
   */

  static storeIndexedDB(table, objects) {
    this.dbPromise.then(function(db) {
      if (!db) return;

      let tx = db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      if (Array.isArray(objects)) {
        objects.forEach(function(object) {
          store.put(object);
        });
      } else {
        store.put(objects);
      }
    });
  }


  static getStoredObjectById(table, idx, id) { // (objectStoreName, the index we target, id)
    return this.dbPromise()
      .then(function (db) {
        if (!db) return;

        const store = db.transaction(table).objectStore(table);
        const indexId = store.index(idx);
        return indexId.getAll(id);
      });
  }

  static fetchReviewsByRestId(id) {
    return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        this.dbPromise()
          .then(db => {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            if (Array.isArray(reviews)) {
              reviews.forEach(function (review) {
                store.put(review);
              });
            } else {
              store.put(reviews);
            }
          });
        console.log('reviews are : ', reviews);
        return Promise.resolve(reviews);
      })
      .catch(error => { //when offline
        return DBHelper.getStoredObjectById('reviews', 'restaurant', id)
          .then((storedReviews) => {
            console.log('Error, looking for offline stored reviews');
            return Promise.resolve(storedReviews);
          });
      });
  }



}