// State management for my-reviews page
let myReviewState = {
    reviews: [],
    currentUserLoggedIn: false,
    editingReview: null,
    cartCount: 0
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadMyReviews(),
        updateCartCount(),
        setupReviewForm(),
        setupEditModal(),
        checkAuthStatus()
    ]);
    document.getElementById('cartBtn').addEventListener('click', () => {
        window.location.href = 'cart.html';
    });
});

// Load user's reviews
async function loadMyReviews() {
    try {
        const response = await ReviewService.fetchMyReviews();
        if (response.success && response.data) {
            myReviewState.reviews = toArray(response);
            renderMyReviews();
        } else {
            console.error('Failed to fetch reviews:', response.message);
            displayNoReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        displayNoReviews();
    }
}

async function updateCartCount() {
    try {
        const response = await ReviewService.getCartCount();
        if (response.success && response.data) {
            myReviewState.cartCount = response.data.totalCartItems;
            document.getElementById('cartCount').textContent = myReviewState.cartCount;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
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

// Render user's reviews
function renderMyReviews() {
    const container = document.getElementById('myReviewsList');
    if (!container) return;

    container.innerHTML = '';

    if (!myReviewState.reviews || myReviewState.reviews.length === 0) {
        displayNoReviews();
        return;
    }

    myReviewState.reviews.forEach(review => {
        container.appendChild(createMyReviewCard(review));
    });
}

// Display no reviews message
function displayNoReviews() {
    const container = document.getElementById('myReviewsList');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-48 py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2.25A3.75 3.75 0 0013.5 15h2.25A3.75 3.75 0 0019 11.25V9m-6-7.5h-1.5A2.25 2.25 0 009 9.25v1.5m6-7.5h1.5m-3 5.25v6m3-6v-2.25A2.25 2.25 0 0015 9m3 5.25v6A2.25 2.25 0 0115.75 21H7.25A2.25 2.25 0 015 18.75v-5.25m12-2.5H5" />
            </svg>
            <p class="text-lg text-slate-500 font-medium">No reviews yet</p>
            <p class="text-sm text-slate-400">Share your first review below!</p>
        </div>
    `;
}

// Create review card for my-reviews page
function createMyReviewCard(review) {
    const reviewCard = document.createElement('div');

    reviewCard.className = `
        bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
        p-6 border border-slate-100 relative group
    `;

    const rating = review.rating || 0;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const createdDate = new Date(review.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    reviewCard.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-start gap-4 flex-1">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    ${review.username ? review.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-slate-800 text-lg">${review.username || 'Anonymous'}</h3>
                    <div class="text-amber-500 font-medium text-sm">${stars}</div>
                    <p class="text-xs text-slate-500 mt-1">${createdDate}</p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="handleEditReview(${review.id})"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit review">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="handleDeleteReview(${review.id})"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete review">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
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

// Handle edit review
function handleEditReview(reviewId) {
    const review = myReviewState.reviews.find(r => r.id === reviewId);
    if (!review) return;

    myReviewState.editingReview = review;

    // Populate edit modal
    document.getElementById('editReviewRating').value = review.rating || 1;
    document.getElementById('editReviewTitle').value = review.title || '';
    document.getElementById('editReviewComment').value = review.comment || '';

    // Update star rating display
    updateEditStarRating(review.rating || 1);

    // Show modal
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

// Handle delete review
async function handleDeleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await ReviewService.deleteReview(reviewId);

        if (response.success) {
            showToast('Review deleted successfully!', 'success');
            await loadMyReviews(); // Reload reviews
        } else {
            showToast(response.message || 'Failed to delete review', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showToast('Error deleting review', 'error');
    }
}

// Setup edit modal
function setupEditModal() {
    const editForm = document.getElementById('editReviewForm');
    const cancelBtn = document.getElementById('cancelEditBtn');

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleUpdateReview();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }

    // Setup edit star rating
    setupEditStarRating();
}

// Handle update review
async function handleUpdateReview() {
    if (!myReviewState.editingReview) return;

    const rating = document.getElementById('editReviewRating').value;
    const title = document.getElementById('editReviewTitle').value;
    const comment = document.getElementById('editReviewComment').value;

    if (!rating || !title) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        const reviewData = {
            rating: parseInt(rating),
            title: title,
            comment: comment || null
        };

        const response = await ReviewService.updateReview(myReviewState.editingReview.id, reviewData);

        if (response.success) {
            showToast('Review updated successfully!', 'success');
            closeEditModal();
            await loadMyReviews(); // Reload reviews
        } else {
            showToast(response.message || 'Failed to update review', 'error');
        }
    } catch (error) {
        console.error('Error updating review:', error);
        showToast('Error updating review', 'error');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
    myReviewState.editingReview = null;
}

// Setup edit star rating
function setupEditStarRating() {
    const starButtons = document.querySelectorAll('.star-btn-edit');
    const ratingInput = document.getElementById('editReviewRating');
    const ratingDisplay = document.getElementById('editRatingDisplay');
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

// Update edit star rating display
function updateEditStarRating(rating) {
    const starButtons = document.querySelectorAll('.star-btn-edit');
    const ratingDisplay = document.getElementById('editRatingDisplay');
    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    starButtons.forEach((btn, index) => {
        if (index < rating) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    ratingDisplay.textContent = `${rating} Star${rating > 1 ? 's' : ''} - ${ratingLabels[rating]}`;
}

// Setup Review Form (for adding new reviews)
function setupReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');
    const successMessage = document.getElementById('successMessage');

    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
        // Hide form if not logged in
        const formContainer = document.querySelector('#reviewForm').closest('section');
        if (formContainer) {
            formContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-800 mb-3">Login Required</h3>
                    <p class="text-slate-500 mb-6">Please log in to share your review</p>
                    <a href="auth/login.html" class="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-[1.5rem] font-bold hover:bg-blue-600 transition-all duration-300 shadow-2xl shadow-slate-200 hover:shadow-blue-200 hover:-translate-y-1">
                        Login to Review
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7-7 7"/></svg>
                    </a>
                </div>
            `;
        }
        return;
    }

    myReviewState.currentUserLoggedIn = true;
    setupStarRating();

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
                    await loadMyReviews();
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

// Setup Star Rating Interaction (for add review form)
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
                ratingDisplay.textContent = 'Select a rating';
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
    ratingDisplay.textContent = 'Select a rating';
}

// Check authentication status
function checkAuthStatus() {
    flag = AuthService.isAuthenticated();
    if (!flag) {
        myReviewState.currentUserLoggedIn = false;
    } else {
        myReviewState.currentUserLoggedIn = true;
    }
}
