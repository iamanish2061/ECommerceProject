const ManageStaffService = {
    getAllStaff: async () => {
        return await request('/admin/staff');
    },

    getStaffDetail: async (id) => {
        return await request(`/admin/staff/${id}`);
    },

    setWorkingHours: async (id, hoursData) => {
        return await request(`/admin/staff/${id}/working-hours`, 'POST', hoursData);
    },

    assignServicesToStaff: async (id, serviceIds) => {
        return await request(`/admin/staff/${id}/services`, 'POST', serviceIds);
    },

    removeServiceFromStaff: async (staffId, serviceId) => {
        return await request(`/admin/staff/${staffId}/services/${serviceId}`, 'DELETE');
    },

    getServiceNameAndId: async () => {
        return await request(`/admin/services/name-and-id`, 'GET');
    }
};