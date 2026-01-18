const ManageServiceService = {
    getAllServices: async () => {
        return await request('/admin/services');
    },

    getAllCategories: async () => {
        return await request('/services/categories');
    },

    getServiceDetail: async (id) => {
        return await request(`/admin/services/${id}`);
    },

    searchServices: async (query) => {
        return await request(`/admin/services/search?query=${query}`);
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

    assignStaffToService: async (serviceId, staffId) => {
        return await request(`/admin/services/${serviceId}/staff/${staffId}`, 'POST');
    },

    removeStaffFromService: async (serviceId, staffId) => {
        return await request(`/admin/services/${serviceId}/staff/${staffId}`, 'DELETE');
    },

    deleteService: async (id) => {
        return await request(`/admin/services/${id}`, 'DELETE');
    }
};

const ManageStaffService = {
    getAllStaff: async () => {
        return await request('/admin/staff');
    },

    getStaffDetail: async (id) => {
        return await request(`/admin/staff/${id}`);
    },

    searchStaff: async (query) => {
        return await request(`/admin/staff/search?query=${query}`);
    },

    assignStaffRole: async (assignData) => {
        return await request('/admin/staff/assign', 'POST', assignData);
    },

    setWorkingHours: async (id, hoursData) => {
        return await request(`/admin/staff/${id}/working-hours`, 'POST', hoursData);
    },

    addStaffLeave: async (id, leaveData) => {
        return await request(`/admin/staff/${id}/leave`, 'POST', leaveData);
    },

    removeStaffLeave: async (staffId, leaveId) => {
        return await request(`/admin/staff/${staffId}/leave/${leaveId}`, 'DELETE');
    },

    assignServicesToStaff: async (id, serviceIds) => {
        return await request(`/admin/staff/${id}/services`, 'POST', serviceIds);
    },

    removeServiceFromStaff: async (staffId, serviceId) => {
        return await request(`/admin/staff/${staffId}/services/${serviceId}`, 'DELETE');
    }
};
