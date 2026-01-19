const SpecificProductManager = {
    productId: null,
    productData: null,
    allTags: [],

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');

        if (!this.productId) {
            alert("No Product ID specified.");
            window.location.href = 'manage-product.html';
            return;
        }
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.handleLogout);

        await this.loadProductData();
        this.setupEventListeners();
        this.fetchAllTags(); // Pre-fetch for add tag modal

    },

    async handleLogout() {
        if (!confirm('Are you sure you want to logout?')) return;

        try {
            // Try to call logout API if AuthService exists
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
                const response = await AuthService.logout();
                if (response?.success) {
                    showToast('Logged out successfully', 'success');
                    setTimeout(() => {
                        window.location.href = '/auth/login.html';
                    }, 500);
                } else {
                    showToast('Failed to log out', 'error');
                }
            } else {
                console.log("auth service not defined");
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async loadProductData() {
        try {
            const res = await ProductService.getProductDetails(this.productId);
            if (res.success) {
                this.productData = res.data;
                this.render();
            } else {
                document.getElementById('loadingState').innerText = "Failed to load product.";
                document.getElementById('loadingState').className = "text-center py-20 text-red-500 font-bold";
            }
        } catch (err) {
            console.error(err);
        }
    },

    async fetchAllTags() {
        const res = await ProductService.getAllTags();
        if (res.success) this.allTags = res.data;
    },

    render() {
        const p = this.productData;
        if (!p) return;

        // Hide loader, show content
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('productContent').classList.remove('hidden');

        // Text Fields
        // Text Fields
        document.title = `Admin - ${p.product.title}`;
        if (document.getElementById('titleId')) document.getElementById('titleId').innerText = p.product.id;
        if (document.getElementById('pTitle')) document.getElementById('pTitle').innerText = p.product.title;
        if (document.getElementById('pSKU')) document.getElementById('pSKU').innerText = p.product.sku || 'N/A';
        if (document.getElementById('pBrand')) document.getElementById('pBrand').innerText = p.product.brand ? p.product.brand.name : 'No Brand';
        if (document.getElementById('pCategory')) document.getElementById('pCategory').innerText = p.product.category ? p.product.category.name : 'No Category';
        if (document.getElementById('pCost')) document.getElementById('pCost').innerText = 'Rs. ' + (p.costPrice || 0);
        if (document.getElementById('pPrice')) document.getElementById('pPrice').innerText = 'Rs. ' + p.product.price;
        if (document.getElementById('pStock')) document.getElementById('pStock').innerText = p.product.stock;

        if (document.getElementById('pShortDesc')) document.getElementById('pShortDesc').innerText = p.product.shortDescription || 'No short description.';
        if (document.getElementById('pLongDesc')) document.getElementById('pLongDesc').innerText = p.product.description || 'No full description.';

        // Image
        document.getElementById('productImage').src = p.product.images.filter(img => img.thumbnail)[0].url || 'https://via.placeholder.com/400';
        // Gallery
        if (p.product.images && p.product.images.length > 0) {
            document.getElementById('imageGallery').innerHTML = p.product.images.map(img =>
                `<img src="${img.url}" class="w-full h-16 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-75" onclick="document.getElementById('productImage').src='${img.url}'">`
            ).join('');
        }

        // Tags
        const tagsContainer = document.getElementById('pTags');
        if (p.product.tags && p.product.tags.length > 0) {
            tagsContainer.innerHTML = p.product.tags.map(t =>
                `<span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">${t.slug}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '<span class="text-sm text-slate-400 italic">No tags assigned.</span>';
        }

        // Modal Pre-fill values
        document.getElementById('modalCurrentPrice').innerText = p.product.price;
        document.getElementById('modalCurrentStock').innerText = p.product.stock;
        document.getElementById('modalShortDescVal').value = p.product.shortDescription || '';
        document.getElementById('modalLongDescVal').value = p.product.description || '';
    },

    setupEventListeners() {
        const id = this.productId;

        // Update Price
        document.getElementById('updatePriceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const price = parseFloat(e.target.price.value);
            try {
                showToast("Updating Price...", "info");
                const res = await ProductService.updatePrice(id, price);
                if (res.success) {
                    SpecificProductUI.closeModal('updatePriceModal');
                    e.target.reset();
                    showToast(res.message || "Updated successfully", "success");
                    this.loadProductData();
                } else showToast(res.message || "Failed to update product price", "error");
            } catch (err) {
                console.error(err);
                showToast("Failed to update", "error");
            }
        });

        // Update Stock
        document.getElementById('updateStockForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const qty = parseInt(e.target.quantity.value);
            try {
                showToast("Updating Stock...", "info");
                const res = await ProductService.updateStock(id, qty);
                if (res.success) {
                    SpecificProductUI.closeModal('updateStockModal');
                    e.target.reset();
                    showToast(res.message || "Successfully updated", "success");
                    this.loadProductData();
                } else showToast(res.message, "error");
            } catch (err) { console.error(err); showToast("Failed", "error"); }
        });

        // Update Short Desc
        document.getElementById('updateShortDescForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = e.target.shortDescription.value;
            try {
                showToast("Updating Short Description...", "info");
                const res = await ProductService.updateShortDescription(id, { shortDescription: text });
                if (res.success) {
                    SpecificProductUI.closeModal('updateShortDescModal');
                    showToast(res.message || "Updated successfully", "success");
                    this.loadProductData();
                } else showToast(res.message, "error");
            } catch (err) { console.error(err); showToast("Failed", "error"); }
        });

        // Update Long Desc
        document.getElementById('updateLongDescForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = e.target.longDescription.value;
            try {
                showToast("Updating Long Description...", "info");
                const res = await ProductService.updateLongDescription(id, { longDescription: text });
                if (res.success) {
                    SpecificProductUI.closeModal('updateLongDescModal');
                    showToast(res.message || "Updated successfully", "success");
                    this.loadProductData();
                } else showToast(res.message, "error");
            } catch (err) { console.error(err); showToast("Failed", "error"); }
        });

        // Add Tags
        document.getElementById('addTagToProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            // Get selected checkboxes
            const checked = Array.from(document.querySelectorAll('input[name="addTagCheckbox"]:checked')).map(cb => cb.value);
            if (checked.length === 0) return;

            try {
                showToast("Adding Tags...", "info");
                const res = await ProductService.addTagsToProduct(id, { tagSlugs: checked });
                if (res.success) {
                    SpecificProductUI.closeModal('addTagModal');
                    showToast(res.message || "Tags added successfully", "success");
                    this.loadProductData();
                } else showToast(res.message, "error");
            } catch (err) { console.error(err); showToast("Failed", "error"); }
        });

        // Remove Tags
        document.getElementById('removeTagFromProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const checked = Array.from(document.querySelectorAll('input[name="removeTagCheckbox"]:checked')).map(cb => cb.value);
            if (checked.length === 0) return;

            try {
                showToast("Removing Tags...", "info");
                const res = await ProductService.removeTagsFromProduct(id, { tagSlugs: checked });
                if (res.success) {
                    SpecificProductUI.closeModal('removeTagModal');
                    showToast(res.message || "Tags removed successfully", "success");
                    this.loadProductData();
                } else showToast(res.message, "error");
            } catch (err) { console.error(err); showToast("Failed", "error"); }
        });
    },

    // Modal Helpers
    renderAddTagList() {
        const container = document.getElementById('availableTagsList');
        const currentTagSlugs = (this.productData.product.tags || []).map(t => t.slug);

        // Filter out tags product already has
        const available = this.allTags.filter(t => !currentTagSlugs.includes(t.slug));

        if (available.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-400 italic">No new tags available to add.</p>';
            return;
        }

        container.innerHTML = available.map(t => `
            <div class="flex items-center">
                <input type="checkbox" name="addTagCheckbox" value="${t.slug}" id="add_${t.slug}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
                <label for="add_${t.slug}" class="ml-2 block text-sm text-gray-900">${t.name} (${t.slug})</label>
            </div>
        `).join('');
    },

    renderRemoveTagList() {
        const container = document.getElementById('currentTagsList');
        const current = this.productData.product.tags || [];

        if (current.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-400 italic">Product has no tags.</p>';
            return;
        }

        container.innerHTML = current.map(t => `
            <div class="flex items-center">
                <input type="checkbox" name="removeTagCheckbox" value="${t.slug}" id="rm_${t.slug}" class="h-4 w-4 text-red-600 border-gray-300 rounded">
                <label for="rm_${t.slug}" class="ml-2 block text-sm text-gray-900">${t.name || t.slug}</label>
            </div>
        `).join('');
    }
};

const SpecificProductUI = {
    openModal(id) {
        document.getElementById(id).classList.remove('hidden');
        // If opening tag modals, re-render lists
        if (id === 'addTagModal') SpecificProductManager.renderAddTagList();
        if (id === 'removeTagModal') SpecificProductManager.renderRemoveTagList();
    },
    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
};
