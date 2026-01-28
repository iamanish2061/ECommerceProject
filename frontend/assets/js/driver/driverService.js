const driverService = {
    // Get driver's profile details
    async getProfile() {
        return await request('/driver/profile', 'GET');
    },

    // Get assigned deliveries
    async getAssignedDeliveries(driverId) {
        return await request(`/driver/assigned-deliveries/${driverId}`, 'GET');
    },

    // Start a delivery
    async startDelivery(username, orderId) {
        return await request(`/driver/delivery/start/${username}?orderId=${orderId}`, 'POST');
    },

    // Complete a delivery
    async completeDelivery(orderId, username) {
        return await request(`/driver/delivery/complete`, 'POST', { orderId, username });
    },

    async completeAllDelivery() {
        return await request(`/driver/delivery/complete-all`, 'POST');
    },
};
