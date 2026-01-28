const ReviewManager = {
    state: {
        reviews: [],
        filteredReviews: [],
        currentReview: null,
        isEditMode: false
    },

    init: async function () {
        await this.fetchReviews();
        this.setupEventListeners();
    },

    fetchReviews: async function () {
        try {
            const response = await ManageReviewService.getAllReviews();
            if (response.success) {
                this.state.reviews = response.data;
                this.state.filteredReviews = [...this.state.reviews];
                this.renderReviews();
            } else {
                showToast(response.message || "Failed to fetch reviews", "error");
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
            showToast("Network error while fetching reviews", "error");
        }
    },

    renderReviews: function () {
        const tableBody = document.getElementById('reviewsTableBody');
        if (!tableBody) return;

        if (this.state.filteredReviews.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No reviews found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = this.state.filteredReviews.map(review => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 text-sm font-medium text-slate-700">#${review.id}</td>
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs overflow-hidden">
                            ${review.profileUrl ? `<img src="${review.profileUrl}" class="w-full h-full object-cover">` : (review.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-medium text-slate-700">${review.username || 'Anonymous'}</span>
                    </div>
                </td>
                <td class="p-4">
                    <div class="flex items-center gap-1 text-yellow-400">
                        ${this.generateStars(review.rating)}
                    </div>
                </td>
                <td class="p-4 text-sm font-medium text-slate-700 max-w-[150px] truncate" title="${review.title}">${review.title}</td>
                <td class="p-4 text-sm text-slate-500 max-w-[200px] truncate" title="${review.comment}">${review.comment || '-'}</td>
                <td class="p-4 text-sm text-slate-500">${this.formatDate(review.createdAt)}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <button onclick="ReviewManager.openViewModal(${review.id})" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button onclick="ReviewManager.deleteReview(${review.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Review">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    generateStars: function (rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${i <= rating ? 'fill-current' : 'text-slate-200 fill-none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>`;
        }
        return stars;
    },

    formatDate: function (dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    setupEventListeners: function () {
        const searchId = document.getElementById('reviewSearchId');
        const searchUser = document.getElementById('reviewSearchUser');
        const searchTitle = document.getElementById('reviewSearchTitle');
        const ratingFilter = document.getElementById('ratingFilter');

        const filterHandler = () => {
            const idVal = searchId.value.toLowerCase();
            const userVal = searchUser.value.toLowerCase();
            const titleVal = searchTitle.value.toLowerCase();
            const ratingVal = ratingFilter.value;

            this.state.filteredReviews = this.state.reviews.filter(review => {
                const matchesId = idVal === '' || String(review.id).toLowerCase().includes(idVal);
                const matchesUser = userVal === '' || (review.username || '').toLowerCase().includes(userVal);
                const matchesTitle = titleVal === '' || (review.title || '').toLowerCase().includes(titleVal);
                const matchesRating = ratingVal === '' || String(review.rating) === ratingVal;

                return matchesId && matchesUser && matchesTitle && matchesRating;
            });
            this.renderReviews();
        };

        searchId?.addEventListener('input', filterHandler);
        searchUser?.addEventListener('input', filterHandler);
        searchTitle?.addEventListener('input', filterHandler);
        ratingFilter?.addEventListener('change', filterHandler);

        document.getElementById('saveReviewBtn')?.addEventListener('click', () => this.saveReview());
    },

    openAddModal: function () {
        this.state.isEditMode = false;
        this.state.currentReview = null;
        this.resetModal();
        document.getElementById('modalTitle').textContent = 'Add Review';
        document.getElementById('saveReviewBtn')?.classList.remove('hidden');
        this.toggleReviewModal(true);
    },

    openViewModal: function (reviewId) {
        const review = this.state.reviews.find(r => r.id === reviewId);
        if (!review) return;

        this.state.currentReview = review;

        document.getElementById('modalTitle').textContent = 'Review Details';
        document.getElementById('reviewRating').value = review.rating;
        document.getElementById('reviewTitle').value = review.title;
        document.getElementById('reviewComment').value = review.comment || '';

        // Make fields readonly for viewing
        document.getElementById('reviewRating').disabled = true;
        document.getElementById('reviewTitle').readOnly = true;
        document.getElementById('reviewComment').readOnly = true;

        // Hide save button in view mode
        document.getElementById('saveReviewBtn')?.classList.add('hidden');

        this.toggleReviewModal(true);
    },

    openEditModal: function (reviewId) {
        const review = this.state.reviews.find(r => r.id === reviewId);
        if (!review) return;

        this.state.isEditMode = true;
        this.state.currentReview = review;

        document.getElementById('modalTitle').textContent = 'Edit Review';
        document.getElementById('reviewRating').value = review.rating;
        document.getElementById('reviewTitle').value = review.title;
        document.getElementById('reviewComment').value = review.comment || '';

        this.toggleReviewModal(true);
    },

    toggleReviewModal: function (show) {
        const modal = document.getElementById('reviewModal');
        if (show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('modal-active');
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.classList.remove('modal-active');
        }
    },

    resetModal: function () {
        document.getElementById('reviewForm').reset();
        document.getElementById('reviewRating').disabled = false;
        document.getElementById('reviewTitle').readOnly = false;
        document.getElementById('reviewComment').readOnly = false;
    },

    saveReview: async function () {
        const rating = document.getElementById('reviewRating').value;
        const title = document.getElementById('reviewTitle').value.trim();
        const comment = document.getElementById('reviewComment').value.trim();

        if (!rating || !title) {
            showToast("Please fill in all required fields", "warning");
            return;
        }

        const reviewData = {
            rating: parseInt(rating),
            title: title,
            comment: comment
        };

        try {
            let response;
            if (this.state.isEditMode) {
                response = await ManageReviewService.updateReview(this.state.currentReview.id, reviewData);
            } else {
                response = await ManageReviewService.saveReview(reviewData);
            }

            if (response.success) {
                showToast(response.message || "Review saved successfully", "success");
                this.toggleReviewModal(false);
                await this.fetchReviews();
            } else {
                showToast(response.message || "Failed to save review", "error");
            }
        } catch (error) {
            console.error("Error saving review:", error);
            showToast("Network error while saving review", "error");
        }
    },

    deleteReview: async function (reviewId) {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            const response = await ManageReviewService.deleteReview(reviewId);
            if (response.success) {
                showToast("Review deleted successfully", "success");
                await this.fetchReviews();
            } else {
                showToast(response.message || "Failed to delete review", "error");
            }
        } catch (error) {
            console.error("Error deleting review:", error);
            showToast("Network error while deleting review", "error");
        }
    }
};
