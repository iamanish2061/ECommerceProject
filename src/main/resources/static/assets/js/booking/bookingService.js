const BookingService = {

    getAvailableTimesAndRecommendations: async (serviceId, bookingDate, staffId) => {
        let url = `/bookings/time?serviceId=${serviceId}&bookingDate=${bookingDate}`;
        if (staffId) url += `&staffId=${staffId}`;
        return await request(url);
    },

    createBooking: async (bookingData) => {
        return await request('/bookings', 'POST', bookingData);
    },

    // for specific user's
    async getAppointmentHistory() {
        return await request(`/bookings/my-appointments`, 'GET');
    },

    async getSpecificAppointmentDetail(appointmentId) {
        return await request(`/bookings/appointment/${appointmentId}`, 'GET');
    },

    async cancelAppointment(appointmentId) {
        return await request(`/bookings/${appointmentId}/cancel`, 'POST');
    }

};
