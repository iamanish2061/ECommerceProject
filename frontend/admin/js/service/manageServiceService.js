const ManageServiceService = {
    getNameAndIdOfStaff: async () => {
        return await request('/admin/staff/name-and-id');
    },

    assignStaffToSpecificService: async (serviceId, payload) => {
        return await request(`/admin/services/assign-staff/${serviceId}`, 'POST', payload);
    },

    getAllServices: async () => {
        return await request('/admin/services');
    },

    getAllCategories: async () => {
        return await request('/services/categories');
    },

    getServiceDetail: async (id) => {
        return await request(`/admin/services/${id}`);
    },

    createService: async (formData) => {
        return await request('/admin/services', 'POST', formData, { isMultiPart: true });
    },

    updateService: async (id, serviceData) => {
        return await request(`/admin/services/${id}`, 'PUT', serviceData);
    },

    toggleServiceStatus: async (id) => {
        return await request(`/admin/services/${id}/toggle`, 'PUT');
    },

    deleteService: async (id) => {
        return await request(`/admin/services/${id}`, 'DELETE');
    },

};

