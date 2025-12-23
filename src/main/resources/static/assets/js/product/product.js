// State management for the product page
let state = {
    categories: [],
    brands: [],
    tags: [],
    products: [],
    filteredProducts: [],
    selectedCategory: null,
    selectedSubCategory: null, // { name, slug }
    selectedBrand: null,
    selectedTag: null,
    searchQuery: '',
};

function toSlug(str) {
    if (!str) return '';
    return str
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function showToast(message,type="info", duration = 3000){
    const toastContainer = document.getElementById('toast-container');
    if(!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(()=>{
        toast.remove();
    },duration);
}

// Helper to extract array from API responses
function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.products)) return data.products;

    return [];
}

// Initialize the page
async function init() {
    try {
        const [categoriesRes, brandsRes, tagsRes, productsRes] = await Promise.all([
            productService.getProductsByCategory(),
            productService.getProductsByBrandDetails(),
            productService.getProductsTags(),
            productService.getProducts()
        ]);

        state.categories = toArray(categoriesRes);
        state.brands = toArray(brandsRes);
        state.tags = toArray(tagsRes);
        state.products = toArray(productsRes);
        state.filteredProducts = [...state.products];

        console.log('Loaded lengths:', {
            categories: state.categories.length,
            brands: state.brands.length,
            tags: state.tags.length,
            products: state.products.length,
        });

        renderCategories();
        renderBrands();
        renderTags();
        renderProducts();

        updateCartCount();
        setEventListeners();

    } catch (error) {
        console.error('Error initializing product page:', error);
        showError('Failed to load products. Please reload the page.');
    }
}

function showError(message) {
    const productContainer = document.getElementById('productsContainer');
    if (productContainer) {
        productContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-red-500 mb-4">${message}</p>
                <button onclick="init()" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-full">
                    Reload
                </button>
            </div>
        `;
    }
}

// Event listeners (search, sort, tags dropdown)
function setEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    const tagBtn = document.getElementById('tagsBtn');
    const tagMenu = document.getElementById('tagsMenu');
    if (tagBtn && tagMenu) {
        tagBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tagMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!tagBtn.contains(e.target) && !tagMenu.contains(e.target)) {
                tagMenu.classList.remove('active');
            }
        });
    }
}

// Search handler
async function handleSearch(query) {
    state.searchQuery = query.trim();

    if (state.searchQuery) {
        try {
            const searchResult = await productService.getSearchedProducts(state.searchQuery);
            let products = toArray(searchResult);

            if (!products.length) {
                const q = state.searchQuery.toLowerCase();
                products = state.products.filter(p =>
                    (p.name || p.productName || p.title || '')
                        .toLowerCase()
                        .includes(q)
                );
            }

            state.filteredProducts = products;
            renderProducts();
        } catch (error) {
            console.error('Error searching products:', error);
            filterProducts();
        }
    } else {
        filterProducts();
    }
}

// Sort handler
function handleSort(e) {
    const sortBy = e.target.value;

    switch (sortBy) {
        case 'price-asc':
            state.filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            state.filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        default:
            state.filteredProducts = [...state.products];
    }
    renderProducts();
}

// Filter products based on current state (fallback when backend fails)
function filterProducts() {
    state.filteredProducts = state.products.filter(product => {
        let matchesCategory = true;
        let matchesBrand = true;
        let matchesTag = true;

        const prodCatSlug = product.categorySlug || toSlug(product.category || '');
        const prodSubCatSlug = product.subCategorySlug || product.subcategorySlug || toSlug(product.subCategory || product.subcategory || '');

        if (state.selectedSubCategory) {
            const subSlug = (state.selectedSubCategory.slug || '').toLowerCase();
            matchesCategory = prodSubCatSlug === subSlug || prodCatSlug === subSlug;
        } else if (state.selectedCategory) {
            const catSlug = state.selectedCategory.toLowerCase();
            matchesCategory = prodCatSlug === catSlug;
        }

        if (state.selectedBrand) {
            const brandSlug = state.selectedBrand.toLowerCase();
            const prodBrandSlug = product.brandSlug || toSlug(product.brand || '');
            matchesBrand = prodBrandSlug === brandSlug;
        }

        if (state.selectedTag) {
            matchesTag = Array.isArray(product.tags) && product.tags.some(t =>
                (t.slug || t) === state.selectedTag
            );
        }

        return matchesCategory && matchesBrand && matchesTag;
    });

    renderProducts();
}

// Render tags dropdown
function renderTags() {
    const container = document.getElementById('tagsMenu');
    if (!container) return;

    container.innerHTML = '<div class="p-2"></div>';
    const tagsDiv = container.firstChild;

    if (!state.tags || state.tags.length === 0) {
        tagsDiv.innerHTML = '<p class="text-sm text-slate-500 text-center py-2">No tags available</p>';
        return;
    }

    state.tags.forEach(tag => {
        const tagName = tag.name || tag;
        const tagSlug = tag.slug || tagName;
        const isActive = state.selectedTag === tagSlug;

        const tagBtn = document.createElement('button');
        tagBtn.className = `
            w-full text-left px-4 py-2 rounded-lg text-sm transition-all
            ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700 hover:bg-blue-50'}
        `;
        tagBtn.textContent = tagName;

        tagBtn.addEventListener('click', async () => {
            state.selectedTag = isActive ? null : tagSlug;
            state.selectedCategory = null;
            state.selectedSubCategory = null;
            state.selectedBrand = null;
            state.searchQuery = '';

            if (state.selectedTag) {
                try {
                    const tagRes = await productService.getProductsTagsSlug(tagSlug);
                    let tagProducts = toArray(tagRes);
                    if (!tagProducts.length) {
                        tagProducts = state.products.filter(p =>
                            Array.isArray(p.tags) && p.tags.some(t => (t.slug || t) === tagSlug)
                        );
                    }
                    state.filteredProducts = tagProducts;
                } catch (err) {
                    console.error('Tag filter error:', err);
                    filterProducts();
                }
            } else {
                state.filteredProducts = [...state.products];
            }

            renderTags();
            renderProducts();
            container.classList.remove('active');
        });

        tagsDiv.appendChild(tagBtn);
    });
}

// Render categories — only first 3 as parents, with manual children
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!state.categories || state.categories.length < 12) {
        container.innerHTML = '<div class="text-center py-4 text-slate-500">Not enough categories (need 12)</div>';
        return;
    }

    // First 3 categories are parents
    const parents = state.categories.slice(0, 3);

    parents.forEach((category, index) => {
        const categoryDiv = document.createElement('div');

        const button = document.createElement('button');
        button.className = 'w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left group';

        const categoryName = category.name || category.title;
        const categorySlug = category.slug || toSlug(categoryName);

        button.innerHTML = `
            <span class="font-medium text-slate-700 group-hover:text-blue-600">${categoryName}</span>
            <svg class="text-slate-400 transition-transform chevron-${categorySlug.replace(/\s/g, '')}" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        `;

        const subDiv = document.createElement('div');
        subDiv.className = 'subcategory-enter ml-4 mt-2 space-y-1';

        // Pass index (0,1,2) to identify which parent
        button.addEventListener('click', () => toggleCategory(categorySlug, index, subDiv));

        categoryDiv.appendChild(button);
        categoryDiv.appendChild(subDiv);
        container.appendChild(categoryDiv);
    });
}

// Toggle category with manual child assignment
async function toggleCategory(categorySlug, parentIndex, subDiv) {
    if (!subDiv) return;

    const chevronClass = `.chevron-${categorySlug.replace(/\s/g, '')}`;
    const chevron = document.querySelector(chevronClass);

    // Close if same parent clicked again
    if (state.selectedCategory === categorySlug && subDiv.classList.contains('active')) {
        subDiv.classList.remove('active');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        resetFilters();
        return;
    }

    // Close all other submenus
    document.querySelectorAll('.subcategory-enter').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('[class*="chevron-"]').forEach(el => el.style.transform = 'rotate(0deg)');

    // Set current parent
    state.selectedCategory = categorySlug;
    state.selectedSubCategory = null;
    state.selectedTag = null;
    state.selectedBrand = null;
    state.searchQuery = '';

    // Manual child selection: index 0 → items 3-5, index 1 → 6-8, index 2 → 9-11
    const childStart = 3 + (parentIndex * 3);
    const subcategories = state.categories.slice(childStart, childStart + 3);

    subDiv.innerHTML = '';

    if (subcategories.length > 0) {
        subcategories.forEach(subcat => {
            const subName = subcat.name || subcat.title || 'Unnamed';
            const subSlug = subcat.slug || toSlug(subName);

            const subButton = document.createElement('button');
            subButton.type = 'button';
            subButton.className = 'block w-full text-left px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200';
            subButton.textContent = subName;

            subButton.addEventListener('click', async (e) => {
                e.stopPropagation();

                state.selectedSubCategory = { name: subName, slug: subSlug };

                try {
                    const res = await productService.getProductsByCategorySlug(subSlug);
                    const products = toArray(res);
                    state.filteredProducts = products.length > 0 ? products : state.products;
                } catch (err) {
                    console.error(`Error fetching subcategory ${subSlug}:`, err);
                    // Fallback client-side
                    state.filteredProducts = state.products.filter(p =>
                        (p.subCategorySlug || p.subcategorySlug || toSlug(p.subCategory || p.subcategory || '')) === subSlug
                    );
                }

                renderProducts();
            });

            subDiv.appendChild(subButton);
        });

        subDiv.classList.add('active');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        // No children → filter by parent
        try {
            const res = await productService.getProductsByCategorySlug(categorySlug);
            const products = toArray(res);
            state.filteredProducts = products.length > 0 ? products : state.products;
        } catch (err) {
            console.error(`Error fetching category ${categorySlug}:`, err);
            filterProducts();
        }
        renderProducts();
    }
}

function resetFilters() {
    state.selectedCategory = null;
    state.selectedSubCategory = null;
    state.selectedTag = null;
    state.selectedBrand = null;
    state.searchQuery = '';
    state.filteredProducts = [...state.products];
    renderProducts();
}

// Render brands with logo
function renderBrands() {
    const container = document.getElementById('brandsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!state.brands || state.brands.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-slate-500">No brands available</div>';
        return;
    }

    state.brands.forEach(brand => {
        const brandName = brand.name || brand.title || 'Unknown Brand';
        const brandSlug = brand.slug || toSlug(brandName);
        const brandLogo = brand.logo || brand.logoUrl || null;

        const btn = document.createElement('button');
        btn.className = 'w-full px-4 py-3 rounded-xl text-left text-slate-700 hover:bg-blue-50 transition-all flex items-center gap-4';

        btn.innerHTML = `
            ${brandLogo
                ? `<img src="${brandLogo}" alt="${brandName}" class="w-10 h-10 object-contain rounded-full border border-gray-200">`
                : `<div class="w-10 h-10 bg-gray-200 rounded-full border border-gray-300 flex items-center justify-center">
                     <span class="text-gray-500 font-bold text-lg">${brandName.charAt(0).toUpperCase()}</span>
                   </div>`
            }
            <span class="font-medium">${brandName}</span>
        `;

        btn.addEventListener('click', () => {
            const slugParam = encodeURIComponent(brandSlug);
            window.location.href = `brand.html?brand=${slugParam}`;
        });

        container.appendChild(btn);
    });
}


function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = `
        bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
        overflow-hidden flex flex-col h-full border border-gray-100
        cursor-pointer group
    `;

    const productId = product.id;
    const productName = product.title || 'Untitled Product';
    const shortDesc = product.shortDescription || '';
    const price = product.price ? `Rs. ${product.price}` : 'Price on request';
    const stock = product.stock;
    const imageUrl = product.imageUrl || null;

    // Stock status badge
    const stockStatus = stock > 10 
        ? `<span class="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">In Stock</span>`
        : stock > 0 
            ? `<span class="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Low Stock</span>`
            : `<span class="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">Out of Stock</span>`;

    productCard.innerHTML = `
        <div class="relative overflow-hidden rounded-xl">  <!-- ADD overflow-hidden here -->
            <div class="bg-gray-50 h-64 flex items-center justify-center group">  <!-- ADD group class -->
                ${imageUrl 
                    ? `<img src="${imageUrl}" alt="${productName}" 
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'; this.onerror=null;">`
                    : `<div class="w-full h-full flex items-center justify-center text-6xl text-gray-300">📦</div>`
                }
            </div>
            <div class="absolute top-3 right-3">
                ${stockStatus}
            </div>
        </div>

        <div class="p-6 flex flex-col flex-1">
            <h3 class="font-bold text-xl text-gray-800 mb-2 line-clamp-2 leading-tight">
                ${productName}
            </h3>
            
            ${shortDesc ? `
                <p class="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                    ${shortDesc}
                </p>
            ` : '<div class="flex-1"></div>'}

            <div class="mt-auto">
                <div class="flex items-center justify-between mb-5">
                    <span class="text-3xl font-bold text-blue-600">${price}</span>
                </div>

                <div class="mt-auto space-y-3">
                    <button class="add-to-cart-btn w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl 
                                    hover:bg-blue-50 font-semibold text-sm transition-all"
                            data-product-id="${productId}"
                            ${stock === 0 ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                    <button class="buy-now-btn w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl 
                                    hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm transition-all shadow-md"
                            data-product-id="${productId}"
                            ${stock === 0 ? 'disabled' : ''}>
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    `;

    // Card click → go to details page (except buttons)
    productCard.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart-btn') || e.target.closest('.buy-now-btn')) {
            return; // Let button handlers work
        }
        if (productId) {
            window.location.href = `details.html?id=${productId}`;
        }
    });

    // Add to Cart Button
    const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (stock === 0) return;

            try {
                const response = await productService.addToCart(productId);
                if(response.success){
                    updateCartCount();
                    showToast(response.message || 'Added to cart!', 'success');
                }else
                    showToast(response.message || 'Failed to add to cart', 'error');
            } catch (err) {
                console.error('Failed to add to cart:', err);
                showToast('Could not add to cart', 'error');
            }
        });
    }

    // Buy Now Button
    const buyNowBtn = productCard.querySelector('.buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (stock === 0) return;

            try {
                // const response = await productService.buyNow(productId);
                // Optionally redirect to checkout
                // window.location.href = '/checkout.html';
                showToast('Proceeding to buy (not implemented)', 'info');
            } catch (err) {
                console.error('Buy now failed:', err);
                showToast('Could not proceed to buy', 'error');
            }
        });
    }

    // Disable buttons visually if out of stock
    if (stock === 0) {
        addToCartBtn?.classList.add('opacity-60', 'cursor-not-allowed');
        buyNowBtn?.classList.add('opacity-60', 'cursor-not-allowed');
    }

    return productCard;
}


// Update heading
function updateProductsHeading() {
    const headingEl = document.getElementById('productsHeading');
    if (!headingEl) return;

    let text = 'All Products';

    if (state.selectedTag) {
        const tagObj = state.tags.find(t => (t.slug || t) === state.selectedTag);
        text = `Products tagged "${tagObj?.name || state.selectedTag}"`;
    } else if (state.selectedSubCategory) {
        text = `Products in "${state.selectedSubCategory.name || state.selectedSubCategory.slug}"`;
    } else if (state.selectedCategory) {
        const catObj = state.categories.find(c => c.slug === state.selectedCategory);
        text = `Products in "${catObj?.name || state.selectedCategory}"`;
    } else if (state.searchQuery) {
        text = `Results for "${state.searchQuery}"`;
    }

    headingEl.textContent = text;
}

// Render products
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    updateProductsHeading();
    container.innerHTML = '';

    if (!state.filteredProducts || state.filteredProducts.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">No products found</div>';
        return;
    }

    state.filteredProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

document.getElementById('cartButton').addEventListener('click', () => {
    window.location.href = 'cart.html';
});

async function updateCartCount() {
        try {
            const response = await cartService.getCartCount();
            const countElement = document.getElementById('cartCount');

            if (response.success && countElement) {
                countElement.textContent = response.data.totalCartItems || 0;
            }
        } catch (error) {
            console.error("error updating cart count", error)
        }
    }

// Start app
document.addEventListener('DOMContentLoaded', init);