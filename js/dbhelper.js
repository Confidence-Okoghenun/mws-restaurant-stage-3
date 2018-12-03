/**
 * Base url for DataBase.
 */
// let  dbUrl = 'http://localhost:1337/restaurants';
let  dbUrl = 'http://penguin.linux.test:1337/restaurants';
/**
 * Register Service Worker.
 */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then(function() {
    console.log("Service Worker Registered");
  });
}
/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return dbUrl;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // Tries to load data from DB
    localforage.getItem('restaurantsData').then(response => {
      console.log('Fetching data from DB');
      callback(null, response);
    }).catch(() => {

      // If DB load fails, load from network
      console.log('Fetching data from server');
      let xhr = new XMLHttpRequest();
      xhr.open("GET", DBHelper.DATABASE_URL);
      xhr.onload = () => {

        if (xhr.status === 200) {
          // Got a success response from server!
          const restaurantsJson = JSON.parse(xhr.responseText);
          localforage.setItem('restaurantsData', restaurantsJson).then(() => {
                  console.log('Saved data in DB');
          }).catch(function(err) {
              console.log(`ERROR :: ${err}`);
          });
          callback(null, restaurantsJson);
        } else {
          // Oops!. Got an error from server.
          const error = `Request failed. Returned status of ${xhr.status}`;
          callback(error, null);
        }

      };
      xhr.send();

    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph) {
      return `/img/${restaurant.photograph}-s.jpg`;
    } else {
      return `/img/${10}-s.jpg`;
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}

// Favorite restaurant handler
function enableFavorite() {
    let favoriteBtns = document.querySelectorAll('.favorite-restaurant');
    favoriteBtns.forEach(favoriteBtn => {
        favoriteBtn.addEventListener('mouseover', () => {
            if(favoriteBtn.src == `${location.origin}/images/icons/favorite.svg`) {
                favoriteBtn.style.filter = 'grayscale(0)';
            } else {
                favoriteBtn.style.filter = 'grayscale(100%)';
            }
        });
        favoriteBtn.addEventListener('mouseout', () => {
            if(favoriteBtn.src == `${location.origin}/images/icons/favorite.svg`) {
                favoriteBtn.style.filter = 'grayscale(100%)';
            } else {
                favoriteBtn.style.filter = 'grayscale(0)';
            }
        });
        favoriteBtn.addEventListener('click', () => {
            let src = favoriteBtn.getAttribute('src'),
            restaurantId = favoriteBtn.getAttribute('data-id');
        
            if(src == '/images/icons/favorite.svg') {
            favoriteBtn.src = '/images/icons/unfavorite.svg';
            // favoriteBtn.style.filter = 'grayscale(0)';
            fetch(`${DBurl}/restaurants/${restaurantId}/?is_favorite=true
            `, {method: 'PUT'})
            .then(response => response.json())
            .then(result => {
                // console.log(result);
                updateResturantDatainDB();
            })
            .catch(error => console.log(error));
            } else {
            favoriteBtn.src = '/images/icons/favorite.svg';
            // favoriteBtn.style.filter = 'grayscale(100%)';
            fetch(`${DBurl}/restaurants/${restaurantId}/?is_favorite=false
            `, {method: 'PUT'})
            .then(response => response.json())
            .then(result => {
                // console.log(result);
                updateResturantDatainDB();
            })
            .catch(error => console.log(error));
            }
        });
    });
  }
  
  function updateResturantDatainDB() {
    fetch(`${DBurl}/restaurants/`)
    .then(response => response.json())
    .then(restaurants => {
      localforage.setItem('restaurantsData', restaurants)
      .then(() => console.log('Updated data in DB'))
      .catch(error => console.log(`ERROR :: ${error}`));
    })
    .catch(error => console.log(error));
  } 