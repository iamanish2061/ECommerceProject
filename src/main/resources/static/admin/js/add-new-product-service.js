const ProductService = {
    baseUrl: '/api', // Update this to match your backend base URL

    async fetchBrands() {
        try {
            const response = await fetch(`${this.baseUrl}/products/brand-details`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch brands: ${response.status}`);
            }

            const data = await response.json();
            // Expecting: { data: [{ slug: 'beardo', name: 'Beardo' }, ...] }
            return data.data || [];
        } catch (error) {
            console.error('Error fetching brands:', error);
            throw error;
        }
    },

    async fetchCategories() {
        try {
            const response = await fetch(`${this.baseUrl}/products/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch categories: ${response.status}`);
            }

            const data = await response.json();
            // Expecting: { data: [{ slug: 'beard-oil', name: 'Beard Oil' }, ...] }
            return data.data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    async fetchTags() {
        try {
            const response = await fetch(`${this.baseUrl}/products/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch tags: ${response.status}`);
            }

            const data = await response.json();
            // Expecting: { data: [{ slug: 'beard-growth', label: 'Beard Growth' }, ...] }
            return data.data || [];
        } catch (error) {
            console.error('Error fetching tags:', error);
            throw error;
        }
    },

    async addProduct(productRequest, imageFiles) {
        const formData = new FormData();
        // Append the JSON part as a string (Spring expects @RequestPart with name "addProductRequest")
        const jsonBlob = new Blob([JSON.stringify(productRequest)], {
                  type: 'application/json'
                });
        formData.append('addProductRequest', jsonBlob);
        // Append each image file with the name "imageFiles" (matches @RequestPart("imageFiles"))
        imageFiles.forEach((file) => {
            formData.append('imageFiles', file);
        });
        try {
            const response = await fetch(`${this.baseUrl}/admin/products/`, {
                method: 'POST',
                body: formData,
                // Do NOT set Content-Type header — browser will set it with boundary automatically
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to add product`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding product:', error);
            throw error instanceof Error ? error : new Error('Network error occurred');
        }
    }
};