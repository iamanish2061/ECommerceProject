const ManagePaymentService = {
    getAllPayments: async () => {
        return await request('/admin/payments');
    },

    getPaymentDetail: async (id) => {
        return await request(`/admin/payments/${id}`);
    },

    updatePaymentStatus: async (id, status) => {
        return await request(`/admin/payments/${id}/status?status=${status}`, 'PUT');
    },

    getAllPaymentStatus: async () => {
        return await request('/admin/payments/get-status');
    }
};
