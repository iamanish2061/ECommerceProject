const UserService = {
    // Fetch all users
    getAllUsers: async () => {
        return await request('/admin/users', 'GET');
    },

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

    // Get Driver Info
    getDriverInfo: async (id) => {
        return await request(`/admin/users/driver-info?id=${id}`, 'GET');
    },

    // Get Staff Info
    getStaffInfo: async (id) => {
        return await request(`/admin/users/staff-info?id=${id}`, 'GET');
    },

    // Assign Driver
    assignDriver: async (driverId) => {
        return await request(`/admin/users/assign-driver/${driverId}`, 'POST');
    },

    // Get User Orders
    getUserOrders: async (userId) => {
        return await request(`/admin/orders/user/${userId}`, 'GET');
    },

    getOrderDetails: async (orderId) => {
        return await request(`/admin/orders/${orderId}/user-profile`, 'GET');
    },

    // Get User Appointments (Dummy)
    getUserAppointments: async (userId) => {
        // Mocking API delay
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: [
                        { id: 101, serviceName: "Haircut", date: "2024-01-15", time: "10:00 AM", status: "SCHEDULED" },
                        { id: 102, serviceName: "Beard Trim", date: "2024-01-12", time: "02:00 PM", status: "COMPLETED" },
                        { id: 105, serviceName: "Facial", date: "2024-01-10", time: "11:00 AM", status: "CANCELLED" }
                    ]
                });
            }, 500);
        });
    }
};
