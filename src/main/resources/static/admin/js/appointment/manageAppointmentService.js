const ManageAppointmentService = {
    getAllAppointments: async () => {
        return await request('/admin/appointments');
    },

    getAppointmentDetail: async (id) => {
        return await request(`/admin/appointments/${id}`);
    },

    updateAppointmentStatus: async (id, status) => {
        return await request(`/admin/appointments/${id}/status?status=${status}`, 'PUT');
    }
};
