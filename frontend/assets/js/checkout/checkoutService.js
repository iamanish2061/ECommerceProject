const checkoutService = {
    async getProductInfo(productId) {
        return await request(`/products/${productId}`, 'GET');
    },

    async fetchAddress(addressType) {
        return await request(`/address/type/${addressType}`, 'GET');
    },

    async calculateDeliveryCharge(addressInfo) {
        return await request(`/orders/calculate-delivery-charge`, 'POST', addressInfo);
    },

    async processSingleProductCheckout(productId, info) {
        return await request(`/orders/single-product-checkout/${productId}`, 'POST', info);
    },

    async processCartCheckout(info) {
        return await request(`/orders/checkout`, 'POST', info);
    },

    async getCartCount() {
        return await request(`/cart/count`, 'GET');
    }

}


