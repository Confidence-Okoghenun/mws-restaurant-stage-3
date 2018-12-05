var newMap;

let restaurant,
deleteReviewsArr = [],
updateReviewsArr = [],
offlineReviewsArr = [],
// DBurl = 'http://localhost:1337',
DBurl = 'http://penguin.linux.test:1337',
// formError = document.querySelector('.form-error'),
formReview = document.querySelector('.from-review'),
offlineText = document.querySelector('.offline-text'),
popupContainer = document.querySelector('.popup-container');
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

let thisRestaurantId = getParameterByName("id");

document.querySelector('.popup-button').addEventListener('click', () => {
  popupContainer.classList.add('hide');
})

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
  name.innerHTML = `${restaurant.name} <img src="/images/icons/${(() => {if(restaurant.is_favorite == 'true'){return 'unfavorite'}else{return 'favorite'}})()}.svg" alt="Favorite" class="favorite-restaurant" title="Favorite" data-id="${restaurant.id}" style="filter: ${(() => {if(restaurant.is_favorite == 'true'){return 'grayscale(0)'}else{return 'grayscale(100%)'}})()}">`;

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
  enableFavorite();
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
  // Tries to load reviews form DB
  localforage.getItem(`reviews_for_restaurant${thisRestaurantId}`)
  .then(restaurant => (restaurant?renderReviews(restaurant):getReviewsFromNetwork()))
  .catch((error) => {
    // If it fails to load form DB then load form network and store in DB
    getReviewsFromNetwork();
  });

  function getReviewsFromNetwork() {
    fetch(`${DBurl}/reviews/?restaurant_id=${thisRestaurantId}`)
    .then(response => response.json())
    .then(restaurant => {

      localforage.setItem(`reviews_for_restaurant${thisRestaurantId}`, restaurant)
      .then(() => console.log('Saved this restaurant reviews in DB'))
      .catch(error => console.log(`ERROR :: ${error}`));
      renderReviews(restaurant)

    }).catch(error => console.log(error));
  }

  function renderReviews(allReviews) {
    if(allReviews) {
      let reviewTemplate = '';
      allReviews.forEach(review => {
        let id = review.id,
        name = review.name,
        rand = Math.random(),
        ratings = review.rating;
        comments = review.comments,
        
        reviewTemplate += `
        <li class="reviewer">
          <div class="reviewer-details">
            <div class="reviewer-with-controls">
              <div class="reviewer-name">${name}</div>
              <div class="reviewer-controls">
                <span class="delete-post" data-postid="${id}" title="Delete"><img src="/images/icons/delete.svg" alt="Delete"></span>
                <span class="edit-post" data-postid="${id}" title="Edit"><img src="/images/icons/edit.svg" alt="Edit"></span>
              </div>
            </div>
            <div class="reviewer-stars">
            <div class="rate">
              <input type="radio" id="star${(() => (rand*5)-id)()}" name="rate${id}" value="5" ${(() => {if(ratings == 5) return 'checked'})()}/>
              <label for="star${(() => (rand*5)-id)()}" title="text">5 stars</label>
              <input type="radio" id="star${(() => (rand*4)-id)()}" name="rate${id}" value="4" ${(() => {if(ratings == 4) return 'checked'})()}/>
              <label for="star${(() => (rand*4)-id)()}" title="text">4 stars</label>
              <input type="radio" id="star${(() => (rand*3)-id)()}" name="rate${id}" value="3" ${(() => {if(ratings == 3) return 'checked'})()}/>
              <label for="star${(() => (rand*3)-id)()}" title="text">3 stars</label>
              <input type="radio" id="star${(() => (rand*2)-id)()}" name="rate${id}" value="2" ${(() => {if(ratings == 2) return 'checked'})()}/>
              <label for="star${(() => (rand*2)-id)()}" title="text">2 stars</label>
              <input type="radio" id="star${(() => (rand*1)-id)()}" name="rate${id}" value="1" ${(() => {if(ratings == 1) return 'checked'})()}/>
              <label for="star${(() => (rand*1)-id)()}" title="text">1 star</label>
            </div>
          </div>
          </div>
          <hr class="reviewer-hr">
          <div class="reviewer-comment">${comments}</div>
        </li>
        `;
      })
      document.getElementById("reviews-list").innerHTML += reviewTemplate;
      enableDeletePost();
      enableUpdatePost();
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
  let rating,
  reviewer_name =  document.querySelector('.form-name').value,
  comment_text = document.querySelector('.form-comment').value;
  
  if(document.querySelector('.form-stars input:checked')) {
    rating = document.querySelector('.form-stars input:checked').value;
  }
  // let thisLocation = location.href;
  let reviewObj = {
    restaurant_id: getParameterByName("id"),
    name: reviewer_name,
    rating: rating,
    comments: comment_text
  }
  console.log(reviewObj)
  if(!reviewer_name || !comment_text || !rating) {
    // formError.classList.remove('hide');
    // setTimeout(() => {
      //   formError.classList.add('hide');
      // }, 2000)
  } else {
    e.preventDefault();
    postReviews('online', reviewObj);
  }
  // location.href = thisLocation;
})

function postReviews(networkStatus, reviewObj) {
  fetch(`${DBurl}/reviews/`, {
    method: 'POST',
    body: JSON.stringify(reviewObj)
  })
  .then(response => response.json())
  .then(restaurant => {
    localforage.setItem(`reviews_for_restaurant${thisRestaurantId}`, restaurant)
    .then(() => console.log('Updated this restaurant reviews in DB'))
    .catch(error => console.log(`ERROR :: ${error}`));
    if(networkStatus == 'online') {
      location.reload();
    }
  })
  .catch(error => {
    console.log(error)
    if (!navigator.onLine) {
      formReview.reset();
      offlineText.innerHTML = `You're offline! Your review will be uploaded when you're back online`;
      popupContainer.classList.remove('hide');
      offlineReviewsArr.push(reviewObj);
      localStorage.setItem('offlineReviews', JSON.stringify(offlineReviewsArr));
      postReviewsWhenBackOnline();
    }
  });
}

function postReviewsWhenBackOnline() {
  window.addEventListener('online', () => {
    let offlineReviews = localStorage.getItem('offlineReviews');
    if(offlineReviews) {
      offlineReviews = JSON.parse(offlineReviews);
      offlineReviews.forEach((offlineReview, i) => {
        console.log(`posted review ${i}`)
        postReviews('offline', offlineReview)
      });
      localStorage.removeItem('offlineReviews');
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
  });
}
/**
 * Enables post deletion
 */
function enableDeletePost() {
  let deletePostBtns = document.querySelectorAll('.delete-post')
  deletePostBtns.forEach(deletePostBtn => {
    deletePostBtn.addEventListener('click', () => {
      console.log('clicked')
      let postId = deletePostBtn.getAttribute('data-postid');
      deleteReviews('online', postId);
    });
  });
}

function deleteReviews(networkStatus, postId) {
  fetch(`${DBurl}/reviews/${postId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(restaurant => {
    localforage.setItem(`reviews_for_restaurant${thisRestaurantId}`, restaurant)
    .then(() => console.log('Deleted this restaurant reviews in DB'))
    .catch(error => console.log(`ERROR :: ${error}`));
    if(networkStatus == 'online') {
      location.reload();
    }
  })
  .catch(error => {
    console.log(error);
    if (!navigator.onLine) {
      document.querySelector(`[data-postid="${postId}"]`).parentElement.parentElement.parentElement.parentElement.classList.add('hide');
      offlineText.innerHTML = `You're offline! The review will be deleted when you're back online`;
      popupContainer.classList.remove('hide');
      deleteReviewsArr.push(postId);
      localStorage.setItem('deleteReviewIds', JSON.stringify(deleteReviewsArr));
      deleteReviewsWhenBackOnline();
    }
  });
}

function deleteReviewsWhenBackOnline() {
  window.addEventListener('online', () => {
    let deleteReviewIds = localStorage.getItem('deleteReviewIds');
    if(deleteReviewIds) {
      deleteReviewIds = JSON.parse(deleteReviewIds);
      deleteReviewIds.forEach((deleteReviewId, i) => {
        console.log(`deleted review ${i}`)
        deleteReviews('offline', deleteReviewId)
      });
      localStorage.removeItem('deleteReviewIds');
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
  });
}
/**
 * Enable updating posts
 */
function enableUpdatePost() {
  let editPostBtns = document.querySelectorAll('.edit-post');
  editPostBtns.forEach((editPostBtn, i) => {
    editPostBtn.addEventListener('click', () => {
      // let post = editPostBtn.parentElement.parentElement.parentElement;
      let id = editPostBtn.getAttribute('data-postid'),
      name = document.querySelectorAll('.reviewer-name')[i],
      stars = document.querySelectorAll('.reviewer-stars')[i],
      comments = document.querySelectorAll('.reviewer-comment')[i],
      controls = document.querySelectorAll('.reviewer-controls')[i],
      nameText = name.textContent,
      commentText = comments.textContent;

      name.style.width = 'fit-content';
      stars.style.pointerEvents = 'unset';

      name.innerHTML = `<input type="text" name="" maxlength="10" style="width: ${name.clientWidth}px" id="name" class="update-name" placeholder="${nameText}" data-oldname="${nameText}">`;
      comments.innerHTML = `<textarea id="comment" style="height: ${comments.clientHeight}px" class="update-comment" data-oldcomment="${commentText}">${commentText}</textarea>`;
      controls.innerHTML = `<span class="save-post" data-postid="${id}" title="Save"><img src="/images/icons/save.svg" alt="Save"></span>`;
      stars.children[0].childNodes.forEach(star => {
        if(star.tagName == 'INPUT' && star.checked) {
          star.removeAttribute('checked')
          star.setAttribute('data-oldchecked', 'true');
        }
      })
      updatePost();
    });
  });
}

function updatePost() {
  let updatePostBtns = document.querySelectorAll('.save-post');
  updatePostBtns.forEach((updatePostBtn, i) => {
    updatePostBtn.addEventListener('click', () => {
      let postId = updatePostBtn.getAttribute('data-postid'),
      name = document.querySelectorAll('.update-name')[i],
      comment = document.querySelectorAll('.update-comment')[i],
      newName = name.value,
      newComment = comment.value,
      stars = updatePostBtn.parentElement.parentElement.parentElement.children[1],
      newRating;
      
      stars.children[0].childNodes.forEach(star => {
        if(star.tagName == 'INPUT' && star.checked) {
          newRating = star.value;
        }
      })

      if(!newName) {
        newName = name.getAttribute('data-oldname');
      }
      if(!newComment) {
        newComment = comment.getAttribute('data-oldcomment');
      }
      if(!newRating) {
        stars.children[0].childNodes.forEach(star => {
          if(star.tagName == 'INPUT' && star.getAttribute('data-oldchecked')) {
            newRating = star.value;
          }
        })
      }

      let updatedReview = {
        name: newName,
        rating: newRating,
        comments: newComment,
        id: postId
      }
      console.log(updatedReview)
      updateReview('online', updatedReview, postId);
    })
  });
}

function updateReview(networkStatus, updatedReview, postId) {
  fetch(`${DBurl}/reviews/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedReview)
    }
  )
  .then(response => response.json())
  .then(restaurant => {
    localforage.setItem(`reviews_for_restaurant${thisRestaurantId}`, restaurant)
    .then(() => console.log('Updated this restaurant reviews in DB'))
    .catch(error => console.log(`ERROR :: ${error}`));
    if(networkStatus == 'online') {
      location.reload();
    }
  })
  .catch(error => {
    console.log(error)
    if (!navigator.onLine) {
      offlineText.innerHTML = `You're offline! The review will be updated when you're back online`;
      popupContainer.classList.remove('hide');
      updateReviewsArr.push(updatedReview);
      localStorage.setItem('updatedReviewEdits', JSON.stringify(updateReviewsArr));
      updateReviewsWhenBackOnline();
    }
  })
}

function updateReviewsWhenBackOnline() {
  window.addEventListener('online', () => {
    let updatedReviewEdits = localStorage.getItem('updatedReviewEdits');
    if(updatedReviewEdits) {
      updatedReviewEdits = JSON.parse(updatedReviewEdits);
      updatedReviewEdits.forEach((updatedReviewEdits, i) => {
        console.log(`updated review ${i}`)
        updateReview('offline', updatedReviewEdits, updatedReviewEdits.id)
      });
      localStorage.removeItem('updatedReviewEdits');
      setTimeout(() => {
        location.reload();
      }, 3000);
    }
  });
}