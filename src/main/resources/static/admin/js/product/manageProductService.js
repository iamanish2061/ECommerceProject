const ProductService = {
    // ----- for manage-product.html -----
    async getAllBrands() {
        return request('/products/brand-details', 'GET');
    },

    async getAllCategories() {
        return request('/products/categories', 'GET');
    },

    async getAllTags() {
        return request('/products/tags', 'GET');
    },

    async getAllProducts() {
        return request('/products', 'GET');
    },

    async getProductsIdAndName() {
        return request('/admin/products/id-and-name', 'GET');
    },

    async addBrand(formData) {
        return request('/admin/products/brand', 'POST', formData);
    },

    async addCategory(formData) {
        return request('/admin/products/category', 'POST', formData);
    },

    async addTag(tagRequest) {
        return request('/admin/products/tags', 'POST', tagRequest);
    },

    async addProduct(formData) {
        return request('/admin/products/', 'POST', formData);
    },

    async sellProducts(sellRequestList) {
        return request('/admin/orders/sell-products', 'POST', sellRequestList);
    },

    // ----- for manage-specific-product.html -----

    async getProductDetails(id) {
        return request(`/admin/products/${id}`, 'GET');
    },

    async updatePrice(id, price) {
        return request(`/admin/products/${id}/price?price=${price}`, 'PUT');
    },

    async updateStock(id, quantity) {
        return request(`/admin/products/${id}/quantity?quantity=${quantity}`, 'PUT');
    },

    async addTagsToProduct(id, tagSlugs) {
        return request(`/admin/products/add-tag-to-product/${id}`, 'PUT', tagSlugs);
    },

    async removeTagsFromProduct(id, tagSlugs) {
        return request(`/admin/products/remove-tag-from-product/${id}`, 'PUT', tagSlugs);
    },

    async updateShortDescription(id, text) {
        return request(`/admin/products/update-short-description/${id}`, 'PUT', text); 
    },

    async updateLongDescription(id, text) {
        return request(`/admin/products/update-long-description/${id}`, 'PUT', text);
    }
};
