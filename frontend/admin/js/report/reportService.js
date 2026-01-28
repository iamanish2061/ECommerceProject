const ReportService = {

    getSalesData: async (period = 'weekly') => {
        return await request(`/admin/reports/sales?period=${period}`);
    },

    getSalesByCategory: async () => {
        return await request(`/admin/reports/sales-by-category`);
    },

    getTopProducts: async () => {
        return await request('/admin/reports/top-products');
    },

    getTopServices: async () => {
        return await request('/admin/reports/top-services');
    },

    getStaffPerformance: async () => {
        return await request('/admin/reports/staff-performance');
    }
};
