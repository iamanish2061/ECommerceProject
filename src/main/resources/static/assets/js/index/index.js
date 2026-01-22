// State management for the index page
let indexState = {
    newArrivalProducts: [],
    bestSellerProducts: [],
    reviews: []
};

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        await loadNewArrivals(),
        await loadBestSellers(),
        await loadReviews(),
        await loadAverageRating()
    ]).then(() => {
        setupReviewForm();
    })
});

// Load New Arrival Products
async function loadNewArrivals() {
    try {
        const response = await IndexService.fetchNewArrivals();
        if (response.success && response.data) {
            indexState.newArrivalProducts = toArray(response);
            renderNewArrivals();
        } else {
            console.error('Failed to fetch new arrivals:', response.message);
        }
    } catch (error) {
        console.error('Error loading new arrivals:', error);
    }
}

// Load Best Seller Products
async function loadBestSellers() {
    try {
        const response = await IndexService.fetchBestSellerProducts();
        if (response.success && response.data) {
            indexState.bestSellerProducts = toArray(response);
            renderBestSellers();
        } else {
            console.error('Failed to fetch best sellers:', response.message);
        }
    } catch (error) {
        console.error('Error loading best sellers:', error);
    }
}

// Load Reviews
async function loadReviews() {
    try {
        const response = await IndexService.fetchReviewsForHomepage();
        if (response.success && response.data) {
            indexState.reviews = toArray(response);
            renderReviews();
        } else {
            console.error('Failed to fetch reviews:', response.message);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

async function loadAverageRating() {
    try {
        const response = await IndexService.fetchAverageReviewRating();
        if (response.success && response.data) {
            document.getElementById('averageRatingValue').textContent = response.data.toFixed(1);
        } else {
            console.error('Failed to fetch average rating:', response.message);
        }
    } catch (error) {
        console.error('Error loading average rating:', error);
    }
}


// Helper to extract array from API responses
function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.products)) return data.products;

    return [];
}

// Render New Arrivals
function renderNewArrivals() {
    const container = document.getElementById('newArrivalsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!indexState.newArrivalProducts || indexState.newArrivalProducts.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">No new products available</div>';
        return;
    }

    indexState.newArrivalProducts.forEach(product => {
        container.appendChild(createIndexProductCard(product));
    });
}

// Render Best Sellers
function renderBestSellers() {
    const container = document.getElementById('bestSellersContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!indexState.bestSellerProducts || indexState.bestSellerProducts.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">No best seller products available</div>';
        return;
    }

    indexState.bestSellerProducts.forEach(product => {
        container.appendChild(createIndexProductCard(product));
    });
}

// Render Reviews
function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!indexState.reviews || indexState.reviews.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">No reviews available</div>';
        return;
    }

    indexState.reviews.forEach(review => {
        container.appendChild(createReviewCard(review));
    });
}

// Create Product Card for Index Page
function createIndexProductCard(product) {
    const productCard = document.createElement('div');

    productCard.className = `
        bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
        overflow-hidden flex flex-col h-full border border-gray-100
        cursor-pointer group
    `;

    const productId = product.id;
    const productName = product.title || 'Untitled Product';
    const shortDesc = product.shortDescription || product.description || '';
    const price = product.price ? `Rs. ${product.price}` : 'Price on request';
    const stock = product.stock;
    const imageUrl = product.imageUrl || null;

    // Stock status badge
    let stockStatus;
    stockStatus = stock > 10
        ? `<span class="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">In Stock</span>`
        : stock > 0
            ? `<span class="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Low Stock</span>`
            : `<span class="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">Out of Stock</span>`;

    productCard.innerHTML = `
        <div class="relative overflow-hidden rounded-t-xl">
            <div class="bg-gray-50 h-48 flex items-center justify-center group p-4">
                ${imageUrl
                    ? `<img src="${imageUrl}" alt="${productName}" 
                        class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'; this.onerror=null;">`
                    : `<div class="w-full h-full flex items-center justify-center text-5xl text-gray-300">📦</div>`
                }
            </div>
            <div class="absolute top-2 right-2">
                ${stockStatus}
            </div>
        </div>

        <div class="p-4 flex flex-col flex-1">
            <h3 class="font-bold text-base text-gray-800 mb-1 line-clamp-1 leading-tight" title="${productName}">
                ${productName}
            </h3>
            
            ${shortDesc ? `
                <p class="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">
                    ${shortDesc}
                </p>
            ` : '<div class="flex-1"></div>'}

            <div class="mt-auto">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xl font-bold text-blue-600">${price}</span>
                </div>

                <div class="flex">
                    <button onclick="window.location.href='details.html?id=${productId}'" class="view-detail-btn flex-1 py-2 px-2 bg-white border border-blue-600 text-blue-600 rounded-lg 
                                    hover:bg-blue-50 font-semibold text-xs transition-all flex items-center justify-center gap-1"
                            data-product-id="${productId}"
                            ${stock === 0 ? 'disabled' : ''}>
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;

    // Card click → go to details page (except buttons)
    productCard.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart-btn') || e.target.closest('.buy-now-btn')) {
            return;
        }
        if (productId) {
            window.location.href = `details.html?id=${productId}`;
        }
    });

    return productCard;
}

// Create Review Card
function createReviewCard(review) {
    const reviewCard = document.createElement('div');
    
    reviewCard.className = `
        bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
        p-6 border border-gray-100
    `;

    const profileUrl = review.profileUrl || 'https://via.placeholder.com/50x50?text=User';
    const rating = review.rating || 0;
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    reviewCard.innerHTML = `
        <div class="flex items-start gap-4 mb-4">
            <img src="${profileUrl}" alt="${review.username}" 
                class="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                onerror="this.src='https://via.placeholder.com/50x50?text=User'; this.onerror=null;">
            <div class="flex-1">
                <h3 class="font-bold text-slate-800">${review.username || 'Anonymous'}</h3>
                <div class="text-sm text-amber-500 font-medium">${stars}</div>
            </div>
        </div>

        <h4 class="font-bold text-slate-800 mb-2 text-lg">${review.title || 'No Title'}</h4>
        
        ${review.comment ? `
            <p class="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-3">
                ${review.comment}
            </p>
        ` : ''}

        <p class="text-xs text-slate-500">
            ${new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
    `;

    return reviewCard;
}

// Setup Review Form
function setupReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');

    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
        reviewForm.style.display = 'none';
    }

    // Setup star rating
    setupStarRating();

    if (reviewForm) {
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

                const response = await IndexService.saveReview(reviewData);

                if (response.success) {
                    showToast('Review submitted successfully!', 'success');
                    reviewForm.reset();
                    clearStarRating();
                    // Reload reviews
                    await loadReviews();
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
            ratingDisplay.textContent = `${ratingLabels[value]}`;
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
