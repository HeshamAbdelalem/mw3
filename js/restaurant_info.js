let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaGVzaGFtYWJkZWxhbGVtIiwiYSI6ImNqaXMyNGNicTFqZHgza3FzanQ1cGw4bTAifQ.1X3DaAYxKMNEPux9OxzhdA',
        maxZoom: 18,
        attribution: '',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    })
    .catch(error => console.error(error));
};



/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }
  const id = parseInt(getParameterByName('id'));
  if (!id || isNaN(id) ) { // no id found in URL
    return Promise.reject('No restaurant id in URL');
  } else {
    return DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        if (!restaurant) {
          return Promise.reject(`Restaurant with ID ${id} was not found`);
        }
        self.restaurant = restaurant;
        fillRestaurantHTML();
        return restaurant;
      });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  const imgurlbase = DBHelper.imageUrlForRestaurant(restaurant);
  const imgparts = imgurlbase.split('.');
  const imgurl1x = imgparts[0] + '_1x.webp';
  const imgurl2x = imgparts[0] + '_2x.webp';
  image.setAttribute('srcset', "/img/"+ restaurant.id +  "_1x.webp 500w, /img/"+ restaurant.id + "_2x.webp 800w");
  //image.srcset = `${imgurl1x} 500w, ${imgurl2x} 800w`; << didn't work
  image.setAttribute('alt', `an image of ${restaurant.name}`);

  image.src = DBHelper.imageUrlForRestaurant(restaurant);



  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsByRestId(restaurant.id)
  .then(reviews => fillReviewsHTML(reviews));
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */

fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  console.log('Reviews:', reviews);
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.id = 'no-review';
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.reverse().forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  if (!navigator.onLine) {
    const connection_status = document.createElement('p');
    connection_status.classList.add('offline_label');
    connection_status.innerHTML = "Offline";
    li.classList.add("reviews_offline");
    li.appendChild(connection_status);
  }

  const name = document.createElement('p');
  name.innerHTML = `Name: ${review.name}`;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = `Date: ${new Date(review.createdAt).toLocaleString()}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  return li;
};

  // ADD a Review Form

addReview = () => {
  event.preventDefault();

  // Getting the data from the form
  let restaurantId = getParameterByName('id');
  let name = document.getElementById('review-author').value;
  let rating;
  let comments = document.getElementById('review-comments').value;
  rating = document.querySelector('#rating_select option:checked').value;
  const review = [name, rating, comments, restaurantId];

  // ADD data to the DOM

  const frontEndReview = {
      restaurant_id: parseInt(review[3]),
      rating: parseInt(review[1]),
      name: review[0],
      comments: review[2].substring(0, 300),
      createdAt: new Date()
  };

  // SEND review to the server
  DBHelper.addReview(frontEndReview);
  addReviewHTML(frontEndReview);
  document.getElementById('review-form').reset();
};


addReviewHTML = (review) => {
  if (document.getElementById('no-review')) {
      document.getElementById('no-review').remove();
  }
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');

  //INSERT the new review on the top
  ul.insertBefore(createReviewHTML(review), ul.firstChild);
  container.appendChild(ul);
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', `${restaurant.name}` );
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
