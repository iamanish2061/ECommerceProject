const ManageReviewService = {
    getAllReviews: async () => {
        return await request('/admin/reviews', 'GET');
    },

    saveReview: async (reviewData) => {
        return await request('/admin/reviews', 'POST', reviewData);
    },

    updateReview: async (reviewId, reviewData) => {
        return await request(`/admin/reviews/${reviewId}`, 'PUT', reviewData);
    },

    deleteReview: async (reviewId) => {
        return await request(`/admin/reviews/${reviewId}`, 'DELETE');
    }
};
