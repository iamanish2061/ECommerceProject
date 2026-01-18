const ManageAppointmentService = {
    getAllAppointments: async () => {
        return await request('/admin/appointments');
    },

    getAppointmentsByStatus: async (status) => {
        return await request(`/admin/appointments/status/${status}`);
    },

    updateAppointmentStatus: async (id, status) => {
        return await request(`/admin/appointments/${id}/status?status=${status}`, 'PUT');
    }
};
