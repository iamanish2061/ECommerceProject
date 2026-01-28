const UserService = {
    // -------------manage-user.html--------------

    // Fetch all users
    getAllUsers: async () => {
        return await request('/admin/users', 'GET');
    },


    // -------------manage-specific-user.html--------------

    // -------------for all--------------------------------
    // Fetch single user details
    getUserDetails: async (id) => {
        return await request(`/admin/users/${id}`, 'GET');
    },

    // Update Role
    updateUserRole: async (id, role) => {
        return await request(`/admin/users/role/${id}?role=${role}`, 'PUT');
    },

    // Update Status
    updateUserStatus: async (id, status) => {
        return await request(`/admin/users/status/${id}?status=${status}`, 'PUT');
    },

    // -------------for driver--------------------------------
    // Get Driver Info
    getDriverInfo: async (id) => {
        return await request(`/admin/users/driver-info?id=${id}`, 'GET');
    },

    // Assign Driver
    assignDriver: async (driverId) => {
        return await request(`/admin/users/assign-driver/${driverId}`, 'POST');
    },

    // -------------for user--------------------------------
    // Get User Orders
    getUserOrders: async (userId) => {
        return await request(`/admin/orders/user/${userId}`, 'GET');
    },

    // Get Order Details
    getOrderDetails: async (orderId) => {
        return await request(`/admin/orders/${orderId}/user-profile`, 'GET');
    },

    // Get User Appointments
    getUserAppointments: async (userId) => {
        return await request(`/admin/appointments/user/${userId}`, 'GET');
    },

    getAppointmentDetails: async (appointmentId) => {
        return await request(`/admin/appointments/${appointmentId}`, 'GET');
    },

    // get info like service and expertise for assigning staff
    getIdAndNameOfServices: async () => {
        return await request(`/admin/services/name-and-id`, 'GET');
    },

    getExpertFieldList: async () => {
        return await request(`/admin/staff/expert-list`, 'GET');
    },

    // to assign the user as staff
    assignUserAsStaff: async (requestBody) => {
        return await request(`/admin/staff/assign`, 'POST', requestBody);
    }
};
