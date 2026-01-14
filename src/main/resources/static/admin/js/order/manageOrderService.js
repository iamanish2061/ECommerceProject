const OrderService = {
    // Fetch all orders
    getAllOrders: async () => {
        return await request('/admin/orders', 'GET');
    },

    // Fetch single order details
    getOrderDetails: async (orderId) => {
        return await request(`/admin/orders/${orderId}`, 'GET');
    },

    // Get status list
    getStatusList: async () => {
        return await request('/admin/orders/status-list', 'GET');
    },

    // Update order status
    updateOrderStatus: async (orderId, status) => {
        return await request(`/admin/orders/${orderId}/status`, 'PUT', { status });
    }
};
