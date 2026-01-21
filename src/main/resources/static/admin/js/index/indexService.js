const indexService = {

    async getDashboardStats() {
        return await request(`/admin/dashboard/stats`, 'GET');
    },

    async getOrders() {
        return await request(`/admin/dashboard/orders`, 'GET');
    },

    async getAppointments() {
        return await request(`/admin/dashboard/appointments`, 'GET');
    },

    async getForms() {
        return await request(`/admin/dashboard/forms`, 'GET');
    },

};

