const ServiceService = {
    getAllServices: async () => {
        return await request('/services');
    },

    getServiceDetail: async (id) => {
        return await request(`/services/${id}`);
    },

    getServicesByCategory: async (category) => {
        return await request(`/services/category/${category}`);
    },

    searchServices: async (query) => {
        return await request(`/services/search?query=${query}`);
    },

    getAllCategories: async () => {
        return await request('/services/categories');
    }
};
