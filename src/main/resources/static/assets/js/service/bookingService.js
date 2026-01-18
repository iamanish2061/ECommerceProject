const BookingService = {
    getRecommendations: async (params) => {
        const { serviceId, staffId, startDate, endDate } = params;
        let url = `/bookings/recommendations?serviceId=${serviceId}`;
        if (staffId) url += `&staffId=${staffId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        return await request(url);
    },

    createBooking: async (bookingData) => {
        return await request('/bookings', 'POST', bookingData);
    },

    confirmBooking: async (transactionId) => {
        return await request(`/bookings/${transactionId}/confirm`, 'POST');
    },

    getMyAppointments: async () => {
        return await request('/bookings/my-appointments');
    },

    getAppointmentDetail: async (id) => {
        return await request(`/bookings/${id}`);
    },

    cancelAppointment: async (id) => {
        return await request(`/bookings/${id}/cancel`, 'POST');
    }
};
