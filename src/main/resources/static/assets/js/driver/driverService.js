const driverService = {
    // Get driver's profile details
    async getProfile() {
        // MOCK DATA FOR TESTING

        return await request('/driver/profile', 'GET');
    },

    // Get assigned deliveries
    async getAssignedDeliveries(driverId) {
        // MOCK DATA FOR TESTING

        return await request(`/driver/assigned-deliveries/${driverId}`, 'GET');
    },

    // Start a delivery
    async startDelivery(username) {
        // MOCK RESPONSE
     
        return await request(`/driver/delivery/start/${username}`, 'POST');
    },

    // Complete a delivery
    async completeDelivery(orderId, username) {
        // MOCK RESPONSE
      
        return await request(`/driver/delivery/complete`, 'POST', { orderId, username });
    }
};

//order completion request
//orderId, username