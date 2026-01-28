const IndexService = {

    /**
     * Save a new review
     * @param {Object} reviewData - { rating, title, comment }
     */
    saveReview: async (reviewData) => {
        return await request('/reviews', "POST", reviewData);
    },

    /**
     * Fetch highly rated reviews for homepage display
     */
    fetchReviewsForHomepage: async () => {
        return await request('/reviews/for-homepage', "GET");
    },

    /**
     * Fetch best seller products
     */
    fetchBestSellerProducts: async () => {
        return await request('/products/best-sellers', "GET");
    },

    /**
     * Fetch new arrival products
     */
    fetchNewArrivals: async () => {
        return await request('/products/new-arrivals', "GET");
    },

    fetchAverageReviewRating: async () => {
        return await request('/reviews/average-rating', "GET");
    }

};