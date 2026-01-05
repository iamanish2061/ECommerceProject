const indexService = {

    async getDashboardStats() {
        return await request(`/admin/dashboard/stats`, 'GET');
    },

};

