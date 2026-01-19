// State management for the product page
let state = {
    recommendedProducts: [],
    purchasedProducts: [],
    cartAndViewedProducts: [],
    products: [],
    categories: [],
    brands: [],
    tags: [],
    filteredProducts: [],
    selectedCategory: null,
    selectedSubCategory: null, // { name, slug }
    selectedBrand: null,
    selectedTag: null,
    searchQuery: '',
    cartCount: 0,
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

// Helper to extract array from API responses
function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.products)) return data.products;

    return [];
}

// Helper to extract products response with personalized recommendations
function extractProductsResponse(res) {
    if (!res || !res.data) return { products: [], recommendedProducts: [], purchasedProducts: [], cartAndViewedProducts: [] };
    const data = res.data;

    // Handle response with personalized and products arrays
    if (data.recommendedProducts && data.products && data.purchasedProducts && data.cartAndViewed) {
        return {
            products: Array.isArray(data.products) ? data.products : [],
            recommendedProducts: Array.isArray(data.recommendedProducts) ? data.recommendedProducts : [],
            purchasedProducts: Array.isArray(data.purchasedProducts) ? data.purchasedProducts : [],
            cartAndViewedProducts: Array.isArray(data.cartAndViewed) ? data.cartAndViewed : []
        };
    }

    // Fallback for other response formats
    return {
        products: toArray(res),
        recommendedProducts: [],
        purchasedProducts: [],
        cartAndViewedProducts: []
    };
}

// Initialize the page
async function init() {
    try {
        const [categoriesRes, brandsRes, tagsRes, productsRes, cartRes] = await Promise.all([
            productService.getProductsByCategory(),
            productService.getProductsByBrandDetails(),
            productService.getProductsTags(),
            productService.getProducts(),
            productService.getCartCount()
        ]);

        state.categories = toArray(categoriesRes);
        state.brands = toArray(brandsRes);
        state.tags = toArray(tagsRes);

        // Extract products and personalized recommendations
        const productsData = extractProductsResponse(productsRes);
        state.products = productsData.products;
        state.recommendedProducts = productsData.recommendedProducts;
        state.purchasedProducts = productsData.purchasedProducts;
        state.cartAndViewedProducts = productsData.cartAndViewedProducts;
        state.filteredProducts = [...state.products];

        if (cartRes.success) {
            state.cartCount = cartRes.data.totalCartItems || 0;
        }

        console.log('Loaded lengths:', {
            categories: state.categories.length,
            brands: state.brands.length,
            tags: state.tags.length,
            products: state.products.length,
            recommendedProducts: state.recommendedProducts.length,
            purchasedProducts: state.purchasedProducts.length,
            cartAndViewedProducts: state.cartAndViewedProducts.length,
        });

        renderCategories();
        renderBrands();
        renderTags();
        renderRecommendedProducts();
        renderPurchasedProducts();
        renderContinueProducts();
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
    const shortDesc = product.shortDescription || product.description || '';
    const price = product.price ? `Rs. ${product.price}` : 'Price on request';
    const stock = product.stock;
    const imageUrl = product.imageUrl || null;

    // Stock status badge
    let stockStatus;
    stockStatus = stock > 10
        ? `<span class="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">In Stock</span>`
        : stock > 0
            ? `<span class="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Low Stock</span>`
            : `<span class="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">Out of Stock</span>`;



    productCard.innerHTML = `
        <div class="relative overflow-hidden rounded-t-xl">
            <div class="bg-gray-50 h-52 flex items-center justify-center group p-4">
                ${imageUrl
            ? `<img src="${imageUrl}" alt="${productName}" 
                        class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'; this.onerror=null;">`
            : `<div class="w-full h-full flex items-center justify-center text-5xl text-gray-300">📦</div>`
        }
            </div>
            <div class="absolute top-2 right-2">
                ${stockStatus}
            </div>
        </div>

        <div class="p-4 flex flex-col flex-1">
            <h3 class="font-bold text-base text-gray-800 mb-1 line-clamp-1 leading-tight" title="${productName}">
                ${productName}
            </h3>
            
            ${shortDesc ? `
                <p class="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">
                    ${shortDesc}
                </p>
            ` : '<div class="flex-1"></div>'}

            <div class="mt-auto">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xl font-bold text-blue-600">${price}</span>
                </div>

                <div class="flex gap-2">
                    <button class="add-to-cart-btn flex-1 py-2 px-2 bg-white border border-blue-600 text-blue-600 rounded-lg 
                                    hover:bg-blue-50 font-semibold text-xs transition-all flex items-center justify-center gap-1"
                            data-product-id="${productId}"
                            ${stock === 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                        Cart
                    </button>
                    <button class="buy-now-btn flex-1 py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg 
                                    hover:from-blue-700 hover:to-indigo-700 font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                            data-product-id="${productId}"
                            ${stock === 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        Buy
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
                showToast('Adding to cart...', 'info');
                const response = await productService.addToCart(productId);
                if (response && response.success) {
                    await updateCartCountByFetching();
                    showToast(response.message || 'Added to cart!', 'success');
                } else
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
                showToast('Redirecting to checkout...', 'info');
                setTimeout(() => {
                    window.location.href = '/checkoutBuy.html?productId=' + encodeURIComponent(productId);
                }, 500);

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

// Helper for Expand/Collapse logic
function handleExpandableSection(products, wrapperId, buttonId) {
    const wrapper = document.getElementById(wrapperId);
    const button = document.getElementById(buttonId);
    const COLLAPSED_HEIGHT = '400px';

    if (!wrapper || !button) return;

    // Reset to collapsed state initially
    wrapper.classList.add(`max-h-[${COLLAPSED_HEIGHT}]`);
    // Ensure we start with the class-based or inline restriction
    wrapper.style.maxHeight = COLLAPSED_HEIGHT;


    // We clone the button to remove previous event listeners to avoid duplicates on re-render
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    if (products && products.length > 4) {
        newButton.classList.remove('hidden');
        newButton.textContent = 'View All';

        newButton.addEventListener('click', () => {
            // Check current numeric height or style to determine toggle state
            // If current style.maxHeight is the collapsed value, we expand.
            if (wrapper.style.maxHeight === COLLAPSED_HEIGHT) {
                // Expand
                wrapper.style.maxHeight = wrapper.scrollHeight + "px";
                newButton.textContent = 'Show Less';
            } else {
                // Collapse
                // First set to current scrollHeight to ensure transition starts from there if it was 'none' (though here we track it)
                // actually if we just set it back to collapsed height, valid CSS transition triggers
                wrapper.style.maxHeight = COLLAPSED_HEIGHT;
                newButton.textContent = 'View All';

                // Scroll slightly if user is deep down to keep context
                // wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    } else {
        newButton.classList.add('hidden');
        wrapper.classList.remove(`max-h-[${COLLAPSED_HEIGHT}]`);
        wrapper.style.maxHeight = '';
    }
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

// Render recommended/personalized products
function renderRecommendedProducts() {
    const container = document.getElementById('recommendedContainer');
    const section = document.getElementById('recommendedSection');

    if (!container || !section) return;

    // Hide section if no recommended products
    if (!state.recommendedProducts || state.recommendedProducts.length === 0) {
        section.style.display = 'none';
        return;
    }

    // Show section and populate products
    section.style.display = 'block';
    container.innerHTML = '';

    state.recommendedProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });

    handleExpandableSection(state.recommendedProducts, 'recommendedWrapper', 'recommendedViewAll');
}

// Render purchased products
function renderPurchasedProducts() {
    const container = document.getElementById('purchaseContainer');
    const section = document.getElementById('purchaseSection');

    if (!container || !section) return;

    // Hide section if no recommended products
    if (!state.purchasedProducts || state.purchasedProducts.length === 0) {
        section.style.display = 'none';
        return;
    }

    // Show section and populate products
    section.style.display = 'block';
    container.innerHTML = '';

    state.purchasedProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });

    handleExpandableSection(state.purchasedProducts, 'purchaseWrapper', 'purchaseViewAll');
}

// Render continue shopping products
function renderContinueProducts() {
    const container = document.getElementById('continueContainer');
    const section = document.getElementById('continueSection');

    if (!container || !section) return;

    // Hide section if no recommended products
    if (!state.cartAndViewedProducts || state.cartAndViewedProducts.length === 0) {
        section.style.display = 'none';
        return;
    }

    // Show section and populate products
    section.style.display = 'block';
    container.innerHTML = '';

    state.cartAndViewedProducts.forEach(product => {
        container.appendChild(createProductCard(product));
    });

    handleExpandableSection(state.cartAndViewedProducts, 'continueWrapper', 'continueViewAll');
}


document.getElementById('cartBtn').addEventListener('click', () => {
    window.location.href = 'cart.html';
});

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = state.cartCount || 0;
    }
}

async function updateCartCountByFetching() {
    const resp = await productService.getCartCount();
    if (resp.success) {
        state.cartCount = resp.data.totalCartItems || 0;
        updateCartCount();
    } else {
        console.error("Failed to fetch cart count");
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);