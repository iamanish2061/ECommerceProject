const cartService = {
    async getAllCartItems(){
        return await request(`/cart`, 'GET');
    },
    
    async getCartCount(){
        return await request(`/cart/count`, 'GET');
    },

    async addToCart(productId){
        return await request(`/cart/add-to-cart/${productId}?quantity=1`, 'PUT');
    },

    async updateCartItem(productId, quantity) {
        return await request(`/cart/${productId}?quantity=${quantity}`, 'PUT');
    },

    async deleteCartItem(productId) {
        return await request(`/cart/${productId}`, 'DELETE');
    },
    
    async deleteAllCartItems() {
        return await request(`/cart/clear`, 'DELETE');
    }
}


