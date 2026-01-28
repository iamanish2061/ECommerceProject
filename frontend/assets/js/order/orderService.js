const orderService = {
    /**
     * Fetch all orders for the current user.
     * @returns {Promise<Object>} API response with list of orders.
     */
    async getOrderHistory() {
        return await request(`/orders/`, 'GET');
    },

    /**
     * Fetch specific details for a single order.
     * @param {number|string} orderId 
     * @returns {Promise<Object>} API response with order details.
     */
    async getOrderDetail(orderId) {
        return await request(`/orders/${orderId}`, 'GET');
    },

    /**
     * Cancel a specific order.
     * @param {number|string} orderId 
     * @returns {Promise<Object>} API response.
     */
    async cancelOrder(orderId) {
        return await request(`/orders/cancel/${orderId}`, 'PUT');
    }
};
