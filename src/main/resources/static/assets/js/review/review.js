// State management for the reviews page
let reviewState = {
    reviews: [],
    currentUserLoggedIn: false,
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllReviews();
    setupReviewForm();
    checkAuthStatus();
});

// Load all reviews
async function loadAllReviews() {
    try {
        const response = await ReviewService.fetchAllReviews();
        if (response.success && response.data) {
            reviewState.reviews = toArray(response);
            renderAllReviews();
        } else {
            console.error('Failed to fetch reviews:', response.message);
            displayNoReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        displayNoReviews();
    }
}

// Helper to extract array from API responses
function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.reviews)) return data.reviews;

    return [];
}

// Render all reviews
function renderAllReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!reviewState.reviews || reviewState.reviews.length === 0) {
        displayNoReviews();
        return;
    }

    reviewState.reviews.forEach(review => {
        container.appendChild(createReviewCardLarge(review));
    });
}

// Display no reviews message
function displayNoReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-48 py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2.25A3.75 3.75 0 0013.5 15h2.25A3.75 3.75 0 0019 11.25V9m-6-7.5h-1.5A2.25 2.25 0 009 9.25v1.5m6-7.5h1.5m-3 5.25v6m3-6v-2.25A2.25 2.25 0 0015 9m3 5.25v6A2.25 2.25 0 0115.75 21H7.25A2.25 2.25 0 015 18.75v-5.25m12-2.5H5" />
            </svg>
            <p class="text-lg text-slate-500 font-medium">No reviews yet</p>
            <p class="text-sm text-slate-400">Be the first to share your experience!</p>
        </div>
    `;
}

// Create large review card
function createReviewCardLarge(review) {
    const reviewCard = document.createElement('div');
    
    reviewCard.className = `
        bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
        p-6 border border-slate-100
    `;

    const profileUrl = review.profileUrl || 'https://via.placeholder.com/50x50?text=User';
    const rating = review.rating || 0;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const createdDate = new Date(review.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    reviewCard.innerHTML = `
        <div class="flex items-start gap-4 mb-4">
            <img src="${profileUrl}" alt="${review.username}" 
                class="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
                onerror="this.src='https://via.placeholder.com/50x50?text=User'; this.onerror=null;">
            <div class="flex-1">
                <h3 class="font-bold text-slate-800 text-lg">${review.username || 'Anonymous'}</h3>
                <div class="text-sm text-amber-500 font-medium">${stars}</div>
                <p class="text-xs text-slate-500 mt-1">${createdDate}</p>
            </div>
        </div>

        <h4 class="font-bold text-slate-800 mb-2 text-base">${review.title || 'No Title'}</h4>
        
        ${review.comment ? `
            <p class="text-slate-600 text-sm leading-relaxed">
                ${review.comment}
            </p>
        ` : ''}
    `;

    return reviewCard;
}

// Setup Review Form
function setupReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');
    const loginPrompt = document.getElementById('loginPrompt');
    const successMessage = document.getElementById('successMessage');

    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
        reviewForm.style.display = 'none';
        loginPrompt.style.display = 'block';
    } else {
        reviewState.currentUserLoggedIn = true;
        setupStarRating();
    }

    if (reviewForm && token) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rating = document.getElementById('reviewRating').value;
            const title = document.getElementById('reviewTitle').value;
            const comment = document.getElementById('reviewComment').value;

            if (!rating || !title) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                const reviewData = {
                    rating: parseInt(rating),
                    title: title,
                    comment: comment || null
                };

                const response = await ReviewService.saveReview(reviewData);

                if (response.success) {
                    showToast('Review submitted successfully!', 'success');
                    successMessage.style.display = 'block';
                    reviewForm.reset();
                    clearStarRating();

                    // Hide success message after 3 seconds
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 3000);

                    // Reload reviews
                    await loadAllReviews();
                } else {
                    showToast(response.message || 'Failed to submit review', 'error');
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                showToast('Error submitting review', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
            }
        });
    }
}

// Setup Star Rating Interaction
function setupStarRating() {
    const starButtons = document.querySelectorAll('.star-btn');
    const ratingInput = document.getElementById('reviewRating');
    const ratingDisplay = document.getElementById('ratingDisplay');
    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    starButtons.forEach(button => {
        // Mouse enter for hover effect
        button.addEventListener('mouseenter', (e) => {
            const value = parseInt(e.target.dataset.value);
            
            // Update all stars based on hover position
            starButtons.forEach((btn, index) => {
                if (index < value) {
                    btn.classList.add('hovered');
                } else {
                    btn.classList.remove('hovered');
                }
            });

            // Update display text
            ratingDisplay.textContent = `${value} Star${value > 1 ? 's' : ''} - ${ratingLabels[value]}`;
        });

        // Mouse leave to reset hover state
        button.addEventListener('mouseleave', () => {
            starButtons.forEach(btn => btn.classList.remove('hovered'));
            
            // Restore display to selected rating or default
            if (ratingInput.value) {
                const selectedValue = parseInt(ratingInput.value);
                ratingDisplay.textContent = `${selectedValue} Star${selectedValue > 1 ? 's' : ''} - ${ratingLabels[selectedValue]}`;
            } else {
                ratingDisplay.textContent = 'Select';
            }
        });

        // Click to select rating
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const value = parseInt(e.target.dataset.value);
            
            // Update hidden input
            ratingInput.value = value;

            // Update star states
            starButtons.forEach((btn, index) => {
                if (index < value) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });

            // Update display text
            ratingDisplay.textContent = `${value} Star${value > 1 ? 's' : ''} - ${ratingLabels[value]}`;
        });
    });
}

// Clear star rating
function clearStarRating() {
    const starButtons = document.querySelectorAll('.star-btn');
    const ratingInput = document.getElementById('reviewRating');
    const ratingDisplay = document.getElementById('ratingDisplay');

    starButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.classList.remove('hovered');
    });

    ratingInput.value = '';
    ratingDisplay.textContent = 'Select';
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        reviewState.currentUserLoggedIn = false;
    } else {
        reviewState.currentUserLoggedIn = true;
    }
}
