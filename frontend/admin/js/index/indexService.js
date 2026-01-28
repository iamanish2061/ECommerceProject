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

    async getLeaveForms() {
        return await request(`/admin/dashboard/leave-forms`, 'GET');
    },

    async updateLeaveFormStatus(staffId, leaveId, status) {
        return await request(`/admin/dashboard/leave-forms/${staffId}/${leaveId}?status=${status}`, 'PUT');
    },

    async getDriverRegistrationForms() {
        return await request(`/admin/dashboard/driver-registration-forms`, 'GET');
    },

    async updateDriverRegistrationStatus(userId, status) {   
        return await request(`/admin/dashboard/driver-registration-forms/${userId}?status=${status}`, 'PUT');
    },

};

