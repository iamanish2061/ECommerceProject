const profileService = {
    // ==================== PROFILE METHODS ====================
    async getProfileDetails() {
        return await request(`/profile/get-details`, 'GET');
    },

    async checkDriverStatus() {
        return await request(`/profile/check-driver-status`, 'GET');
    },

    async changePassword(data) {
        return await request(`/profile/change-password`, 'POST', data);
    },

    async registerDriver(formData) {
        return await request(`/profile/register-driver`, 'POST', formData, {
            isMultiPart: true
        });
    },

    async changePhoto(formData) {
        return await request(`/profile/change-photo`, 'PUT', formData, {
            isMultiPart: true
        });
    },

    // ==================== ADDRESS METHODS ====================
    async getAddressType(addressType) {
        return await request(`/address/fetch-type/${addressType}`, 'GET');
    },

    async addAddress(data) {
        return await request(`/address/add`, 'POST', data);
    },

    async updateAddress(addressId, data) {
        return await request(`/address/update/${addressId}`, 'PUT', data);
    },



    // ==================== ORDER METHODS ====================
    async getDetailOrder() {
        return await request(`/orders`, 'GET');
    },

    async getOrderForProfile() {
        return await request(`/orders/for-profile`, 'GET');
    },

    async getSpecificOrderDetail(orderId) {
        return await request(`/orders/${orderId}`, 'GET');
    },

    async cancelOrder(orderId) {
        return await request(`/orders/cancel/${orderId}`, 'PUT');
    }
};