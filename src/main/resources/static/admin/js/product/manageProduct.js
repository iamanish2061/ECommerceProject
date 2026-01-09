function showToast(message, type = "info", duration = 1500) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}

const ProductManager = {
    state: {
        brands: [],
        categories: [],
        tags: [],
        products: [],
        productsForSale: [] // {id, name, stock} for dropdowns
    },

    async init() {
        await this.loadAllData();
        this.setupEventListeners();
    },

    async loadAllData() {
        // Parallel fetch for efficiency
        try {
            const [brandsRes, catsRes, tagsRes, productsRes, productIdsRes] = await Promise.all([
                ProductService.getAllBrands(),
                ProductService.getAllCategories(),
                ProductService.getAllTags(),
                ProductService.getAllProducts(),
                ProductService.getProductsIdAndName()
            ]);

            if (brandsRes.success) this.state.brands = brandsRes.data;
            if (catsRes.success) this.state.categories = catsRes.data;
            if (tagsRes.success) this.state.tags = tagsRes.data;

            if (productsRes.success) {
                this.state.products = productsRes.data.products || [];
            }

            if (productIdsRes.success) this.state.productsForSale = productIdsRes.data;

            this.renderAll();
        } catch (error) {
            console.error("Failed to load initial data", error);
            // showToast("Failed to load some data", "error"); 
        }
    },

    renderAll() {
        this.renderProductTable();
        this.populateModalSelects();
    },

    // --- Renders ---

    renderProductTable() {
        const tbody = document.getElementById('productsTableBody');
        const filter = document.getElementById('productSearch').value.toLowerCase();

        const filteredProducts = this.state.products.filter(p =>
            (p.title && p.title.toLowerCase().includes(filter)) ||
            (p.id && p.id.toString().includes(filter))
        );

        if (filteredProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">No products found.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredProducts.map(p => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${p.imageUrl || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg object-cover bg-slate-200" alt="${p.title}">
                        <div>
                            <div class="text-sm font-semibold text-slate-700">${p.title}</div>
                            <div class="text-xs text-slate-400">ID: ${p.id}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${p.stock > 10 ? 'bg-green-100 text-green-700' : (p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}">
                        ${p.stock} in stock
                    </span>
                </td>
                <td class="p-4 text-left text-sm font-bold text-slate-700">
                    Rs. ${p.price}
                </td>
                <td class="p-4 text-left">
                    <a href="manage-specific-product.html?id=${p.id}" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold hover:underline">View</a>
                </td>
            </tr>
        `).join('');
    },

    populateModalSelects() {
        // Brands
        const brandSelect = document.getElementById('addProductBrandSelect');
        brandSelect.innerHTML = '<option value="">Select Brand</option>' + this.state.brands.map(b => `<option value="${b.slug}">${b.name}</option>`).join('');

        // Categories
        const catSelect = document.getElementById('addProductCategorySelect');
        catSelect.innerHTML = '<option value="">Select Category</option>' + this.state.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');

        // Tags (Checkboxes)
        const tagContainer = document.getElementById('addProductTagsContainer');
        if (this.state.tags.length === 0) {
            tagContainer.innerHTML = '<span class="text-xs text-gray-400 italic">No tags available</span>';
        } else {
            tagContainer.innerHTML = this.state.tags.map(tag => `
                <label class="flex items-center space-x-2 py-1 cursor-pointer hover:bg-white rounded px-1 transition-colors">
                    <input type="checkbox" name="tagSlugs" value="${tag.slug}" class="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                    <span class="text-xs text-gray-600">${tag.name}</span>
                </label>
            `).join('');
        }
    },

    // --- Image Management ---
    imageCount: 0,
    MAX_IMAGES: 4,

    addImageField() {
        if (this.imageCount >= this.MAX_IMAGES) {
            showToast("Maximum 4 images allowed", "error");
            return;
        }

        const container = document.getElementById('modalImagesContainer');

        // Remove 'empty' message if it exists
        if (this.imageCount === 0) container.innerHTML = '';

        this.imageCount++;
        const id = Date.now(); // unique id for DOM elements

        const div = document.createElement('div');
        div.className = 'p-3 bg-white rounded-xl border border-gray-200 shadow-sm text-xs relative group animate-fade-in-up';
        div.dataset.id = id;
        div.innerHTML = `
            <button type="button" onclick="ProductManager.removeImageField(${id})" class="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div class="space-y-2">
                <div>
                     <label class="block font-semibold text-gray-500 mb-1">Image File <span class="text-red-500">*</span></label>
                    <input type="file" name="imageFile_${id}" accept="image/*" required onchange="ProductManager.handleImageFileSelect(this, ${id})" 
                        class="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <input type="text" name="imageName_${id}" placeholder="Image Name *" required class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div>
                        <input type="text" name="imageAlt_${id}" placeholder="Alt Text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                </div>
                <div class="flex items-center pt-1">
                     <label class="flex items-center cursor-pointer gap-2">
                        <input type="radio" name="thumbnail" value="${id}" ${this.imageCount === 1 ? 'checked' : ''} class="w-3.5 h-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500">
                        <span class="text-xs text-gray-600">Use as Thumbnail</span>
                    </label>
                </div>
            </div>
        `;
        container.appendChild(div);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    removeImageField(id) {
        const container = document.getElementById('modalImagesContainer');
        const div = container.querySelector(`div[data-id="${id}"]`);
        if (div) {
            div.remove();
            this.imageCount--;
            if (this.imageCount === 0) {
                container.innerHTML = '<div class="text-center py-10 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-xl">No images added yet. Click "Add Image" to start.</div>';
            } else {
                // Ensure one thumbnail is selected if the deleted one was selected
                const radios = container.querySelectorAll('input[type="radio"]');
                if (radios.length > 0 && !container.querySelector('input[type="radio"]:checked')) {
                    radios[0].checked = true;
                }
            }
        }
    },

    handleImageFileSelect(input, id) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const nameInput = document.querySelector(`input[name="imageName_${id}"]`);
            if (nameInput && !nameInput.value) {
                nameInput.value = file.name;
            }
        }
    },

    // --- UI Helpers ---

    setupEventListeners() {
        // Search
        document.getElementById('productSearch').addEventListener('input', () => this.renderProductTable());

        // Forms
        document.getElementById('addBrandForm').addEventListener('submit', (e) => this.handleAddBrand(e));
        document.getElementById('addCategoryForm').addEventListener('submit', (e) => this.handleAddCategory(e));
        document.getElementById('addTagForm').addEventListener('submit', (e) => this.handleAddTag(e));

        // New Product Form with Image Management
        document.getElementById('newProductForm').addEventListener('submit', (e) => this.handleAddProduct(e));

        document.getElementById('sellForm').addEventListener('submit', (e) => this.handleSellProduct(e));
    },

    // --- Form Handlers ---

    async handleAddBrand(e) {
        e.preventDefault();
        showToast("Adding brand...", "info");
        const formData = new FormData(e.target);
        const json = {
            name: formData.get('name')
        };
        // API expects 'addBrandRequest' part as JSON and 'logo' as file
        const apiData = new FormData();
        apiData.append('addBrandRequest', new Blob([JSON.stringify(json)], { type: 'application/json' }));
        apiData.append('logo', formData.get('logo'));

        try {
            const res = await ProductService.addBrand(apiData);
            if (res.success) {
                ProductUI.closeModal('brandModal');
                e.target.reset();
                showToast(res.message || "Added successfully", "success");
                this.loadAllData(); // Refresh list
            } else {
                showToast(res.message); // Fallback
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to add brand");
        }
    },

    async handleAddCategory(e) {
        e.preventDefault();
        showToast("Adding category", "info");
        const formData = new FormData(e.target);
        const json = {
            name: formData.get('name'),
            parentSlug: formData.get('parentSlug') || null
        };

        const apiData = new FormData();
        apiData.append('addCategoryRequest', new Blob([JSON.stringify(json)], { type: 'application/json' }));
        apiData.append('image', formData.get('image'));

        console.log("addCatReq : " + formData.get("name"));
        console.log("addCatReq : " + formData.get("parentSlug"));

        try {
            const res = await ProductService.addCategory(apiData);
            if (res.success) {
                ProductUI.closeModal('categoryModal');
                e.target.reset();
                showToast(res.message || "Category added successfully", "success");
                this.loadAllData();
            } else {
                showToast(res.message || "Failed to add category", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to add category", "error");
        }
    },

    async handleAddTag(e) {
        e.preventDefault();
        showToast("Adding tag", "info");
        const formData = new FormData(e.target);
        const req = {
            name: formData.get('tagName')
        };
        // API expects TagRequest which has tagName field
        try {
            const res = await ProductService.addTag(req);
            if (res.success) {
                ProductUI.closeModal('tagModal');
                e.target.reset();
                showToast(res.message || "Tag added successfully", "success");
                this.loadAllData();
            } else {
                showToast(res.message || "Failed to add tag", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to add tag");
        }
    },

    async handleAddProduct(e) {
        e.preventDefault();

        if (this.imageCount === 0) {
            showToast("At least one image is required", "error");
            return;
        }

        const formData = new FormData(e.target);

        // Collect Tag Slugs
        const tagSlugs = Array.from(document.querySelectorAll('input[name="tagSlugs"]:checked')).map(cb => cb.value);

        // Collect Images Metadata & Files
        const imagesMetadata = [];
        const imageFiles = [];

        const imageDivs = document.querySelectorAll('#modalImagesContainer > div');

        imageDivs.forEach(div => {
            const id = div.dataset.id;
            const fileInput = div.querySelector(`input[name="imageFile_${id}"]`);
            const nameInput = div.querySelector(`input[name="imageName_${id}"]`);
            const altInput = div.querySelector(`input[name="imageAlt_${id}"]`);
            const radio = div.querySelector(`input[name="thumbnail"][value="${id}"]`);

            if (fileInput.files[0]) {
                imageFiles.push(fileInput.files[0]);
                imagesMetadata.push({
                    name: nameInput.value,
                    altText: altInput.value || null,
                    thumbnail: radio.checked
                });
            }
        });

        const json = {
            title: formData.get('title'),
            sku: formData.get('sku'),
            sizeMl: formData.get('sizeMl'),
            brandSlug: formData.get('brandSlug'),
            categorySlug: formData.get('categorySlug'),
            costPrice: parseFloat(formData.get('costPrice')),
            sellingPrice: parseFloat(formData.get('sellingPrice')),
            stock: parseInt(formData.get('stock')),
            active: formData.get('active') === 'on',
            shortDescription: formData.get('shortDescription'),
            description: formData.get('description'),
            tagSlugs: tagSlugs,
            images: imagesMetadata
        };

        const apiData = new FormData();
        apiData.append('addProductRequest', new Blob([JSON.stringify(json)], { type: 'application/json' }));

        // Append all files with same key 'imageFiles'
        imageFiles.forEach(file => {
            apiData.append('imageFiles', file);
        });

        try {
            showToast("Saving product...", "info");
            // Button is outside form in new layout, find by form attribute
            const btn = document.querySelector('button[form="newProductForm"]');
            let originalText = "Save Product";

            if (btn) {
                originalText = btn.innerText;
                btn.disabled = true;
                btn.innerText = "Saving...";
            }

            const res = await ProductService.addProduct(apiData);

            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }

            if (res.success) {
                ProductUI.closeModal('addProductModal');
                e.target.reset();
                showToast("Product added successfully", "success");
                // Reset Image State
                this.imageCount = 0;
                document.getElementById('modalImagesContainer').innerHTML = `
                    <div class="text-center py-10 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-xl">
                        No images added yet. Click "Add Image" to start.
                    </div>
                `;

                showToast("Product added successfully", "success");
                this.loadAllData();
            } else {
                showToast(res.message || 'Failed to add product', "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to add product", "error");
        }
    },

    async handleSellProduct(e) {
        e.preventDefault();
        showToast("Saving sales...", "info");
        const rows = document.querySelectorAll('#sellProductRows > div');
        const requests = [];
        let valid = true;

        rows.forEach(row => {
            const select = row.querySelector('select');
            const input = row.querySelector('input');
            const id = parseInt(select.value);
            const qty = parseInt(input.value);

            if (!id || !qty || qty < 1) {
                valid = false;
                return;
            }
            requests.push({ productId: id, quantity: qty });
        });

        if (!valid || requests.length === 0) {
            showToast("Please fill all fields correctly", "info");
            return;
        }

        try {
            const res = await ProductService.sellProducts(requests);
            if (res.success) {
                ProductUI.closeModal('sellProductModal');
                e.target.reset();
                showToast(res.message || "Successful", "success");
                document.getElementById('sellProductRows').innerHTML = '';
                this.loadAllData(); // Stock updates
            } else {
                showToast(res.message || "Failed to sell", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to sell", "error");
        }
    }
};

// UI Interaction Helpers (exposed globally for HTML onclicks)
const ProductUI = {
    openModal(id) {
        const modal = document.getElementById(id);
        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');

        if (id === 'sellProductModal') {
            // Add one row by default if empty
            const rows = document.getElementById('sellProductRows');
            if (rows.children.length === 0) {
                this.addSellRow();
            }
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    },

    addSellRow() {
        const container = document.getElementById('sellProductRows');
        const row = document.createElement('div');
        row.className = 'flex gap-4 items-end bg-slate-50 p-3 rounded';

        // Generate options (from state)
        const options = ProductManager.state.productsForSale.map(p =>
            `<option value="${p.id}">${p.title} (Qty: ${p.stock})</option>`
        ).join('');

        row.innerHTML = `
            <div class="flex-1">
                <label class="block text-xs font-bold text-slate-500 mb-1">Product</label>
                <select class="w-full p-2 border rounded text-sm bg-white" required>
                    <option value="">Select Product...</option>
                    ${options}
                </select>
            </div>
            <div class="w-24">
                <label class="block text-xs font-bold text-slate-500 mb-1">Qty</label>
                <input type="number" min="1" class="w-full p-2 border rounded text-sm" required>
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2">
                &times;
            </button>
        `;
        container.appendChild(row);
    }
};
