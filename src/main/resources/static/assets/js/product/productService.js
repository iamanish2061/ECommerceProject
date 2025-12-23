const productService = {
    async getProducts() {
        return await request(`/products`, 'GET');
    },

    async getProductsById(Id) {
        return await request(`/products/${Id}`, 'GET');
    },

    async getProductsTags(){
        return await request('/products/tags', 'GET');
    },

    async getProductsTagsSlug(tagSlug){
        return await request(`/products/tags/${tagSlug}`,'GET');
    },

    async getSearchedProducts(query){
        return await request(`/products/searched?query=${encodeURIComponent(query)}`,'GET');
    },

    async getProductsByCategory(){
        return await request('/products/categories','GET');
    },

    async getProductsByCategorySlug(categorySlug){
        return await request(`/products/category-products/${categorySlug}`,'GET');
    },

    async getProductsByBrandDetails(){
        return await request('/products/brand-details', 'GET');
    },
    async getProductsByBrandSlug(brandSlug){
        return await request(`/products/brand-details/${brandSlug}`, 'GET');
    },
    async addToCart(productId){
        return await request(`/cart/add-to-cart/${productId}?quantity=1`, 'PUT');
    },
    async buyNow(productId){
        return await request(`/order/buy-now/${productId}`, 'POST');
    }

};