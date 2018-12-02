// let DBurl = 'http://localhost:1337';
let DBurl = 'http://penguin.linux.test:1337';

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