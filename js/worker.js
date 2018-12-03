/**
 * Create restaurant HTML.
 */
onmessage = function(e) {
  let lis = '',
  restaurants = e.data;
  if(restaurants) {
    restaurants.forEach(restaurant => {
        lis += `
        <li><picture><img class="restaurant-img" alt="${restaurant.name} restaurant" src="${(() => {if(restaurant.photograph) {return `/img/${restaurant.photograph}-s.jpg`;} else {return `/img/${10}-s.jpg`;}})()}"></picture><h1>${restaurant.name} <img src="/images/icons/${(() => {if(restaurant.is_favorite == 'true'){return 'unfavorite'}else{return 'favorite'}})()}.svg" alt="Favorite" class="favorite-restaurant" title="Favorite" data-id="${restaurant.id}" style="filter: ${(() => {if(restaurant.is_favorite == 'true'){return 'grayscale(0)'}else{return 'grayscale(100%)'}})()}"></h1><p>${restaurant.neighborhood}</p><p>${restaurant.address}</p><a aria-label="View Details of ${restaurant.name} restaurant" href="./restaurant.html?id=${restaurant.id}">View Details</a></li>
        `;
    });
  
    postMessage(lis);
  }

};
