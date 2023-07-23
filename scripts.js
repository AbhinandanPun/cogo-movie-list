const apiKey = 'fac4e496';
let currentPage = 1;
let searchQuery = "batman"; // initial movie, i saved time or else i had to randomize this
let moviesOnCurrentPage = [];
let userFeedbackArray = [];
const searchStatus = document.getElementById('search-status');

initializePage();
// **************** Update the feebacks in LOCAL STORAGE
async function initializePage() {
  // add event listeners
  document.getElementById("searchButton").addEventListener("click", performSearch);
  document.getElementById("prevButton").addEventListener("click", showPreviousPage);
  document.getElementById("nextButton").addEventListener("click", showNextPage);
  // when all feedback deleted ==> [] or is not in local storage 
  if(localStorage.getItem("feedback") && localStorage.getItem("feedback").length !== 2) { 
    userFeedbackArray = JSON.parse(localStorage.getItem("feedback"));
  }
  // fetch data
  displayMovies(await fetchMovies());
  updatePagination(); 
}

// **************** Update the feebacks in LOCAL STORAGE
function updateFeedbacksInLocalStorage() {
  localStorage.setItem("feedback", JSON.stringify(userFeedbackArray));
}

// **************** Fetch Movies from the API
async function fetchMovies() {
  searchStatus.innerHTML = ``;
  try {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${searchQuery}&page=${currentPage}&type=movie`);
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    const data = await response.json();
    if(data.Response === "True")  return data.Search || [];
    else throw new Error(data.Error);
  } 
  catch (error) {
    searchStatus.innerHTML = `${error}... Try a different search`; // display appropriate message
    return []; // Return an empty array in case of an error
  }
}

// **************** Fetch only details
async function fetchMovieDetails(movieID) {
  searchStatus.innerHTML = ``;
  try {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${movieID}&type=movie`);
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    const data = await response.json();
    return data;
  }
  catch(error) {
    searchStatus.innerHTML = `${error}... Try a different search`; // display appropriate message
    return []; // Return an empty array in case of an error
  }
}

// **************** Function to handle the pagination 
function updatePagination() {
  const currentPageElement = document.getElementById("currentPage");
  currentPageElement.textContent = currentPage;
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  if (currentPage === 1) {
    prevButton.disabled = true;
  } else {
    prevButton.disabled = false;
  }
}

// **************** Show the next page if any
async function showNextPage() {
  ++currentPage;
  const nextTenMovies = await fetchMovies();
  if(nextTenMovies.length) {
    displayMovies(nextTenMovies);
    updatePagination();
  } 
}

// **************** Show the previous page if not on the first page
async function showPreviousPage() {
  if (currentPage > 1) {
    --currentPage;
    const prevTenMovies = await fetchMovies();
    displayMovies(prevTenMovies);
    updatePagination();
  }
}
  
// **************** Display the movies in the movie container
function displayMovies(movies) {
  const moviesContainer = document.getElementById("moviesContainer");
  moviesContainer.innerHTML = "";
  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.className = "movie-card";

    const posterImg = document.createElement("img");
    posterImg.src = movie.Poster;
    posterImg.alt = movie.Title;
    const titleHeading = document.createElement("h5");
    titleHeading.textContent = movie.Title;

    movieCard.appendChild(posterImg);
    movieCard.appendChild(titleHeading);
    movieCard.addEventListener("click", () => openModal(movie)); // Add click event to display movie details

    moviesContainer.appendChild(movieCard);
  });
}

// **************** modals activation for the movie details
const modal = document.getElementById('filter-modal');
const closeBtn = modal.querySelector('.close');
closeBtn.addEventListener('click', closeModal);
function openModal(movie) {
  modal.style.display = 'block';
  showMovieDetails(movie);
}
function closeModal() {
  const movieDetailsHtmlElement = document.getElementById("movieDetails");
  movieDetailsHtmlElement.innerHTML = ``;
  modal.style.display = 'none';
}
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});


// **************** Show the Details of the movies and render the DOM
async function showMovieDetails(movie) {
  const feedback = userFeedbackArray.find(feedback => feedback.feedback_id === movie.imdbID); // if already rated
  let rating = comment = "";
  if(feedback) {
    rating = feedback.rating;
    comment = feedback.comment;
  }
  const movieDetailsHtmlElement = document.getElementById("movieDetails");
  movieDetailsHtmlElement.style.display = "block";

  const posterImg = document.createElement("img");
  posterImg.src = movie.Poster;
  posterImg.alt = movie.Title;

  movieDetailsHtmlElement.appendChild(posterImg);

  const movieDetails = await fetchMovieDetails(movie.imdbID); // get the details of the movie

  // **************** dynamically add the <h6> tags for the details
  Object.keys(movieDetails).forEach(key => {
    const hTag = document.createElement("h6");
    if(key!=="Ratings" && key!=="Poster"){
      hTag.innerHTML = `${key} : ${movieDetails[key]}`;  
      movieDetailsHtmlElement.appendChild(hTag);
    }  
  });

  const feedbackForm = document.createElement("div");
  feedbackForm.className = "form-for-user-rating";
  feedbackForm.innerHTML = `
  <div id="ratingInput" class="rating-container">
  <p>Rating (1-5 stars):</p>
  <label><input type="radio" name="rating" value="1" ${(rating==="1")? "checked" : "" }><span></span></label>
  <label><input type="radio" name="rating" value="2" ${(rating==="2")? "checked" : "" }><span></span></label>
  <label><input type="radio" name="rating" value="3" ${(rating==="3")? "checked" : "" }><span></span></label>
  <label><input type="radio" name="rating" value="4" ${(rating==="4")? "checked" : "" }><span></span></label>
  <label><input type="radio" name="rating" value="5" ${(rating==="5")? "checked" : "" }><span></span></label>
</div>
    <textarea id="commentInput" placeholder="Leave a comment">${comment}</textarea>
    <h4 id="message" style="color:red;"></h4>
    <div class="rating-buttons">
      <button id="saveButton" style="margin-right:10px;" onclick="saveRatingAndComment('${movie.imdbID}')">Save Rating & Comment</button>
      <button id="saveButton" onclick="closeModal()">Hide Details</button>
    <div>
  `;
  movieDetailsHtmlElement.appendChild(feedbackForm);
}

// **************** Save or Edit User Rating and save in the local storage
function saveRatingAndComment(movieId) {
  const message = document.getElementById("message"); // for rating submission status

  const commentInput = document.getElementById("commentInput");
  const selectedRatingInput = document.querySelector('input[name="rating"]:checked');
  const comment = commentInput.value.trim();
  if (selectedRatingInput && comment!=="") {
    const rating = selectedRatingInput.value;

    const feedback = userFeedbackArray.find(feedback => feedback.feedback_id === movieId); // push if new rating otherwise edit
    if(feedback){                                                                           
      feedback.comment = comment;
      feedback.rating = rating;
    }
    else {
      userFeedbackArray.push({
        "feedback_id": movieId,
        "comment": comment,
        "rating": rating,
      });
    }
    message.innerHTML = `Your Rating has been saved`;
  } 
  else {
    message.innerHTML = `Please enter both the field`;
  }
  updateFeedbacksInLocalStorage();
}


// **************** Search Operation Handler
async function performSearch() {
  const searchInput = document.getElementById("searchInput");
  searchQuery = searchInput.value.trim();

  if (searchQuery !== "") {
    currentPage = 1; // reinitialize
    const movies = await fetchMovies();
    displayMovies(movies);
    updatePagination();
  }
}
