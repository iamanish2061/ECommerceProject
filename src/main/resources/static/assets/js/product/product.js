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

// Helper to create a loading spinner
function getLoadingSpinner() {
    return `
        <div class="flex items-center justify-center py-8 w-full">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    `;
}

// Helper to extract products response with personalized recommendations
function extractProductsResponse(res) {
    const data = (res && res.data) ? res.data : {};

    state.products = Array.isArray(data.products) ? data.products : toArray(res);
    state.recommendedProducts = Array.isArray(data.recommendedProducts) ? data.recommendedProducts : [];
    state.purchasedProducts = Array.isArray(data.purchasedProducts) ? data.purchasedProducts : [];
    state.cartAndViewedProducts = Array.isArray(data.cartAndViewed) ? data.cartAndViewed : [];
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
        extractProductsResponse(productsRes);
        state.filteredProducts = [...state.products];

        if (cartRes.success) {
            state.cartCount = cartRes.data.totalCartItems || 0;
        }

        // Initialize UI components
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
    const searchInputs = [
        document.getElementById('searchInput'),
        document.getElementById('mobileSearchInput')
    ].filter(el => el !== null);

    searchInputs.forEach(input => {
        let searchTimeout;
        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
        });
    });

    // Sort listener replacement
    const sortBtn = document.getElementById('sortBtn');
    const sortMenu = document.getElementById('sortMenu');
    if (sortBtn && sortMenu) {
        sortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('active');
            // Close tags menu if open
            document.getElementById('tagsMenu')?.classList.remove('active');
        });

        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                handleSort(value);
                sortMenu.classList.remove('active');
            });
        });
    }

    const tagBtn = document.getElementById('tagsBtn');
    const tagMenu = document.getElementById('tagsMenu');
    if (tagBtn && tagMenu) {
        tagBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tagMenu.classList.toggle('active');
            // Close sort menu if open
            document.getElementById('sortMenu')?.classList.remove('active');
        });
    }

    // Click outside to close menus
    document.addEventListener('click', (e) => {
        const sortDropdown = document.getElementById('sortDropdown');
        const tagsDropdown = document.querySelector('.tags-dropdown'); // General class

        if (sortDropdown && !sortDropdown.contains(e.target)) {
            document.getElementById('sortMenu')?.classList.remove('active');
        }

        const tagsMenu = document.getElementById('tagsMenu');
        const tagsBtn = document.getElementById('tagsBtn');
        if (tagsMenu && tagsBtn && !tagsBtn.contains(e.target) && !tagsMenu.contains(e.target)) {
            tagsMenu.classList.remove('active');
        }
    });

    // Mobile search sync with desktop
    const mobileSearch = document.getElementById('mobileSearchInput');
    const desktopSearch = document.getElementById('searchInput');
    if (mobileSearch && desktopSearch) {
        mobileSearch.addEventListener('input', (e) => {
            desktopSearch.value = e.target.value;
            // No need to dispatch Event('input') as handleSearch handles both independently,
            // but we sync visually for UX.
        });
        desktopSearch.addEventListener('input', (e) => {
            mobileSearch.value = e.target.value;
        });
    }

    // Hamburger Menu toggle
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
    }

    // Mobile filter toggle
    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    if (mobileFilterBtn) {
        mobileFilterBtn.addEventListener('click', toggleSidebar);
    }

    // Sidebar Close (Overlay and Close Button)
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('sidebarClose');
    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

    // Cart redirect
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }

    // Profile Dropdown Toggle
    const profileBtn = document.querySelector('#profileWrapper > a');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) { // Touch logic for mobile
                e.preventDefault();
                profileDropdown.classList.toggle('active');
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
function handleSort(sortBy) {
    const label = document.getElementById('sortLabel');
    const options = document.querySelectorAll('.sort-option');

    // Update Label
    if (label) {
        const selectedOption = Array.from(options).find(opt => opt.dataset.value === sortBy);
        if (selectedOption) {
            label.textContent = selectedOption.textContent;
        }
    }

    // Update Active Class
    options.forEach(opt => {
        if (opt.dataset.value === sortBy) {
            opt.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
        } else {
            opt.classList.remove('bg-blue-50', 'text-blue-700', 'font-bold');
        }
    });

    switch (sortBy) {
        case 'price-asc':
            state.filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            state.filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        default:
            // Featured - original order
            state.filteredProducts = [...state.products];
            // Re-apply other filters if they exist
            if (state.selectedCategory || state.selectedBrand || state.selectedTag || state.searchQuery) {
                filterProducts();
            }
            break;
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
    const label = document.getElementById('tagLabel');
    if (!container) return;

    container.innerHTML = '<div class="grid grid-cols-1 gap-1 p-2"></div>';
    const tagsDiv = container.firstChild;

    // Update button label
    if (label) {
        if (state.selectedTag) {
            // Find current tag name
            const currentTag = state.tags.find(t => (t.slug || t) === state.selectedTag);
            label.textContent = currentTag ? (currentTag.name || currentTag) : 'Tags';
        } else {
            label.textContent = 'Tags';
        }
    }

    // Add "All Tags" clear option at the top if a tag is selected
    if (state.selectedTag) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'w-full text-left px-4 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-medium transition-all mb-1 border-b border-blue-100 pb-2';
        clearBtn.textContent = '✕ Clear Filter';
        clearBtn.onclick = () => {
            state.selectedTag = null;
            state.filteredProducts = [...state.products];
            renderTags();
            renderProducts();
            container.classList.remove('active');
        };
        tagsDiv.appendChild(clearBtn);
    }

    if (!state.tags || state.tags.length === 0) {
        tagsDiv.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No tags available</p>';
        return;
    }

    // Sort tags alphabetically
    const sortedTags = [...state.tags].sort((a, b) => {
        const nameA = ((a.name || a) + "").toLowerCase();
        const nameB = ((b.name || b) + "").toLowerCase();
        return nameA.localeCompare(nameB);
    });

    sortedTags.forEach(tag => {
        const tagName = tag.name || tag;
        if (!tagName || (tagName + "").trim() === "") return; // Skip empty tags

        const tagSlug = tag.slug || tagName;
        const isActive = state.selectedTag === tagSlug;

        const tagBtn = document.createElement('button');
        tagBtn.className = `
            w-full text-left px-4 py-2 rounded-lg text-sm transition-all
            ${isActive ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'}
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

            // Scroll to product heading on mobile to show results
            if (window.innerWidth < 768) {
                document.getElementById('productsHeading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        tagsDiv.appendChild(tagBtn);
    });
}

// Render categories — only first 3 as parents, with manual children
function renderCategories() {
    const containers = [
        document.getElementById('categoriesContainer'),
        document.getElementById('mobileCategoriesContainer')
    ].filter(el => el !== null);

    if (containers.length === 0) return;

    containers.forEach(container => {
        container.innerHTML = '';

        if (!state.categories || state.categories.length === 0) {
            container.innerHTML = getLoadingSpinner();
            return;
        }

        if (state.categories.length < 12) {
            container.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs">More categories soon...</div>';
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
            const chevronId = `chevron-${categorySlug.replace(/[^a-zA-Z0-9]/g, '-')}-${container.id}`;

            button.innerHTML = `
                <span class="font-medium text-slate-700 group-hover:text-blue-600">${categoryName}</span>
                <svg id="${chevronId}" class="text-slate-400 transition-transform" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            `;

            const subDiv = document.createElement('div');
            subDiv.className = 'subcategory-enter ml-4 mt-2 space-y-1';

            button.addEventListener('click', () => toggleCategory(categorySlug, index, subDiv, chevronId));

            categoryDiv.appendChild(button);
            categoryDiv.appendChild(subDiv);
            container.appendChild(categoryDiv);
        });
    });
}

// Toggle category with manual child assignment
async function toggleCategory(categorySlug, parentIndex, subDiv, chevronId) {
    if (!subDiv) return;

    const chevron = document.getElementById(chevronId);

    // Close if same parent clicked again
    if (state.selectedCategory === categorySlug && subDiv.classList.contains('active')) {
        subDiv.classList.remove('active');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        resetFilters();
        return;
    }

    // Close all other submenus (within the same container relative scope if needed, but global is fine here)
    document.querySelectorAll('.subcategory-enter').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('[id^="chevron-"]').forEach(el => el.style.transform = 'rotate(0deg)');

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
                if (window.innerWidth < 768) closeSidebar();
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
        if (window.innerWidth < 768) closeSidebar();
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
    const containers = [
        document.getElementById('brandsContainer'),
        document.getElementById('mobileBrandsContainer')
    ].filter(el => el !== null);

    if (containers.length === 0) return;

    containers.forEach(container => {
        container.innerHTML = '';

        if (!state.brands || state.brands.length === 0) {
            container.innerHTML = getLoadingSpinner();
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
            if (!AuthService.isAuthenticated()) {
                showToast('Please login to continue', 'error');
                return;
            }

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
            if (!AuthService.isAuthenticated()) {
                showToast('Please login to continue', 'error');
                return;
            }

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

function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('show');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);