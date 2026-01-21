const BookingService = {

    getAvailableTimesAndRecommendations: async (serviceId, bookingDate, staffId) => {
        let url = `/bookings/time?serviceId=${serviceId}&bookingDate=${bookingDate}`;
        if (staffId) url += `&staffId=${staffId}`;
        return await request(url);
    },

    createBooking: async (bookingData) => {
        return await request('/bookings', 'POST', bookingData);
    }

};
