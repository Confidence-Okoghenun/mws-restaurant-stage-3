let restaurant;
var newMap;

// let DBurl = 'http://localhost:1337';
let DBurl = 'http://penguin.linux.test:1337';
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
        {
          mapboxToken:
            "pk.eyJ1IjoiY29uZmlkZW5jZS1va29naGVudW4iLCJhIjoiY2prbjdjcmJxMmNjcDNxcGo2OTN1YmlhdyJ9.fgG31oJF6QpSBCOL2w2jxA",
          maxZoom: 18,
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: "mapbox.streets"
        }
      ).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
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
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.setAttribute("alt", `${restaurant.name} restaurant`);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  fetch(`${DBurl}/reviews/?restaurant_id=${getParameterByName("id")}`)
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    console.log(myJson);
    renderReviews(myJson)
  });
  function renderReviews(allReviews) {
    if(allReviews) {
      let reviewTemplate = '', counter = 1;
      
      allReviews.forEach(review => {
        let name = review.name,
        comments = review.comments,
        ratings = review.rating,
        id = review.id;
        reviewTemplate += `
        <li class="reviewer">
          <div class="reviewer-details">
            <div class="reviewer-name">${name}
              <span class="delete-post" data-postid="${id}" title="Delete"><img src="/images/icons/delete.svg" alt="Delete"></span>
            </div>
            <div class="reviewer-stars">
            <div class="rate">
              <input type="radio" id="star5" name="rate${counter}" value="5" ${(() => {if(ratings == 5) return 'checked'})()}/>
              <label for="star5" title="text">5 stars</label>
              <input type="radio" id="star4" name="rate${counter}" value="4" ${(() => {if(ratings == 4) return 'checked'})()}/>
              <label for="star4" title="text">4 stars</label>
              <input type="radio" id="star3" name="rate${counter}" value="3" ${(() => {if(ratings == 3) return 'checked'})()}/>
              <label for="star3" title="text">3 stars</label>
              <input type="radio" id="star2" name="rate${counter}" value="2" ${(() => {if(ratings == 2) return 'checked'})()}/>
              <label for="star2" title="text">2 stars</label>
              <input type="radio" id="star1" name="rate${counter}" value="1" ${(() => {if(ratings == 1) return 'checked'})()}/>
              <label for="star1" title="text">1 star</label>
            </div>
          </div>
          </div>
          <hr class="reviewer-hr">
          <div class="reviewer-comment">${comments}</div>
        </li>
        `;
        counter++;
      })
      document.getElementById("reviews-list").innerHTML += reviewTemplate;
      enableDeletePost();
    } else {
      const container = document.getElementById("reviews-container");
      const noReviews = document.createElement("p");
      noReviews.innerHTML = "No reviews yet!";
      container.appendChild(noReviews);
      return;
    }
  }
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

/**
 * Removes focus ring form some none interactive elements
 */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    let tabedElems = document.querySelectorAll(".leaflet-pane");
    tabedElems.forEach(tabedElem => {
      let children = tabedElem.children;
      for (let i = 0; i < children.length; i++) {
        children[i].setAttribute("tabindex", "-1");
      }
    });
    document.querySelector(".inside").setAttribute("tabindex", "-1");
    let tabedElem = document.querySelector(".leaflet-container");
    tabedElem.setAttribute(
      "aria-label",
      `Location of ${
        document.querySelector("#restaurant-name").textContent
      } restaurant on the map`
    );

    tabedElems = document.querySelector(".leaflet-control-attribution");
    for (let i = 0; i < tabedElems.children.length; i++) {
      tabedElems.children[i].setAttribute("tabindex", "-1");
      // tabedElem.children[i].setAttribute('tabindex', '-1');
    }
    // tabedElems.children.forEach(tabedElem => {
    // })
  }, 5000);
});

let submitFormBtn = document.querySelector('.form-submit');
submitFormBtn.addEventListener('click', (e) => {
  // e.preventDefault();
 let reviewer_name =  document.querySelector('.form-name').value,
 comment_text = document.querySelector('.form-comment').value,
 rating = document.querySelector('.form-stars input:checked').value;

  let reviewObj = {
    restaurant_id: getParameterByName("id"),
    name: reviewer_name,
    rating: rating,
    comments: comment_text
  }
  console.log(reviewObj)
  postData(`${DBurl}/reviews/`, 'POST', reviewObj)
})
function postData(url, method, data) {
  fetch(url, {
    method: method,
    body: JSON.stringify(data)
  })
    .then(function(response) {
      // console.log(response)
      return response.json();
    })
    .then(function(myJson) {
      console.log(JSON.stringify(myJson));
      console.log(myJson);
      // location.reload()
      // return JSON.stringify(myJson);
    })
    .catch(error => {
      console.log(error)
    });
}

function enableDeletePost() {
  let deletePostBtns = document.querySelectorAll('.delete-post')
  deletePostBtns.forEach(deletePostBtn => {
    deletePostBtn.addEventListener('click', () => {
      console.log('clicked')
      let postId = deletePostBtn.getAttribute('data-postid')
      fetch(`${DBurl}/reviews/${postId}`, {
        method: 'DELETE'
      })
      .then(function(response) {
        console.log(response)
        return response.json();
      })
      .then(function(myJson) {
        console.log(JSON.stringify(myJson));
        console.log(myJson);
        // location.reload()
        // return JSON.stringify(myJson);
      })
      .catch(error => {
        console.log(error)
      });
    })
  })
}