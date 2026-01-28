const StaffService = {
    getProfile: async () => {
        return await request("/staff", "GET");
    },

    getUpcomingAppointments: async () => {
        return await request("/staff/upcoming-appointments", "GET");
    },

    getAppointmentHistory: async () => {
        return await request("/staff/appointment-history", "GET");
    },

    requestLeave: async (leaveData) => {
        return await request("/staff/request-leave", "POST", leaveData);
    },

    cancelLeave: async (leaveId) => {
        return await request(`/staff/cancel-leave/${leaveId}`, "PUT");
    },

    getLeaves: async () => {
        return await request("/staff/leaves", "GET");
    }
};
