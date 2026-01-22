const ReviewService={
    fetchAllReviews : async()=>{
        return await request('/reviews', "GET");
    },

    saveReview : async(reviewData)=>{
        return await request('/reviews', "POST", reviewData);
    },

    // for specific user review page
    fetchMyReviews : async()=>{
        return await request('/reviews/my-reviews', "GET");
    },

    updateReview : async(reviewId, reviewData)=>{
        return await request(`/reviews/${reviewId}`, "PUT", reviewData);
    },

    deleteReview : async(reviewId)=>{
        return await request(`/reviews/${reviewId}`, "DELETE");
    },

    async getCartCount() {
        return await request(`/cart/count`, 'GET');
    }

}