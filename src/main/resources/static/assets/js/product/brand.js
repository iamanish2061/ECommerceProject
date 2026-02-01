let brandState = {
    brands: [],
    selectedBrandSlug: null,
    selectedBrand: null,
    products: [],
    filteredProducts: [],
    searchQuery: '',
    cartCount: 0
};

// helper: convert name to slug, similar to product page
function toSlug(str) {
    if (!str) return '';
    return str
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// simple helper to get an array from your API response
function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.products)) return data.products;

    return [];
}

// parse /brand.html?brand=slug
function getBrandSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('brand');
    if (!raw) return null;
    return decodeURIComponent(raw);
}

// ---------- INIT ----------

async function initBrandPage() {
    try {
        // 1) load all brands for sidebar
        const [brandsRes, cartResp] = await Promise.all([
            productService.getProductsByBrandDetails(),
            productService.getCartCount()
        ])
        brandState.brands = toArray(brandsRes);
        if (cartResp.success) {
            brandState.cartCount = cartResp.data.totalCartItems || 0;
        }

        // 2) decide which brand is selected (from URL or first brand)
        let urlSlug = getBrandSlugFromUrl();
        if (!urlSlug && brandState.brands.length > 0) {
            // default to first brand
            const first = brandState.brands[0];
            urlSlug = first.slug || toSlug(first.name || first.title || '');
        }

        if (urlSlug) {
            brandState.selectedBrandSlug = urlSlug.toLowerCase();
            await loadBrandBySlug(brandState.selectedBrandSlug);
        }

        renderBrandSidebar();
        renderBrandHeader();
        renderBrandProducts();

        updateCartCount();
        setupBrandEventListeners();
        setupResponsiveEventListeners();
    } catch (err) {
        console.error('Error initializing brand page:', err);
        const container = document.getElementById('brandProductsContainer');
        if (container) {
            container.innerHTML =
                '<div class="col-span-full text-center py-12 text-red-500">Failed to load brand data.</div>';
        }
    }
}

// ---------- LOAD BRAND DATA ----------
async function loadBrandBySlug(slug) {
    try {
        const res = await productService.getProductsByBrandSlug(slug);
        const data = res.data;

        // flexible parsing: try to find { brand, products } in various shapes
        let brand = null;
        let products = [];

        if (data) {
            if (Array.isArray(data)) {
                // data is directly array of products
                products = data;
            } else {
                brand =
                    data.brand ||
                    data.details ||
                    null;

                if (Array.isArray(data.products)) products = data.products;
                else if (Array.isArray(data.content)) products = data.content;
                else if (Array.isArray(data.items)) products = data.items;
            }
        }

        if (!brand) {
            // try to match from the brands list
            const fromList = brandState.brands.find(b => {
                const s = (b.slug || toSlug(b.name || b.title || '')).toLowerCase();
                return s === slug.toLowerCase();
            });
            brand = fromList || null;
        }

        brandState.selectedBrand = brand;
        brandState.products = products;
        brandState.filteredProducts = [...products];

        // update heading and header immediately
        renderBrandHeader();
        renderBrandProducts();
    } catch (err) {
        console.error('Error loading brand by slug:', err);
        brandState.products = [];
        brandState.filteredProducts = [];
    }
}

// ---------- RENDER: SIDEBAR ----------

function renderBrandSidebar() {
    const desktopContainer = document.getElementById('brandsSidebarContainer');
    const mobileContainer = document.getElementById('mobileBrandsSidebarContainer');

    if (desktopContainer) desktopContainer.innerHTML = '';
    if (mobileContainer) mobileContainer.innerHTML = '';

    if (!brandState.brands || brandState.brands.length === 0) {
        container.innerHTML =
            '<div class="text-center py-4 text-slate-500 text-sm">No brands available</div>';
        return;
    }

    brandState.brands.forEach(brand => {
        const name = brand.name;
        const slug = brand.slug.toLowerCase();
        const brandLogo = brand.logo || brand.logoUrl || null;
        const isActive = slug === brandState.selectedBrandSlug;

        const btn = document.createElement('button');
        btn.className =
            'w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm ' +
            (isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-blue-50 text-slate-700');

        btn.innerHTML = `
            ${brandLogo
                ? `<img src="${brandLogo}" alt="${name}" class="w-10 h-10 object-contain rounded-full border border-gray-200">`
                : `<div class="w-10 h-10 bg-gray-200 rounded-full border border-gray-300 flex items-center justify-center">
                     <span class="text-gray-500 font-bold text-lg">${name.charAt(0).toUpperCase()}</span>
                   </div>`
            }
            <span class="font-medium">${name}</span>
        `;
        // Clone for mobile
        const mobileBtn = btn.cloneNode(true);
        mobileBtn.addEventListener('click', async () => {
            if (brandState.selectedBrandSlug === slug) return;
            handleBrandSelection(slug);
            closeMobileSidebar();
        });

        btn.addEventListener('click', async () => {
            if (brandState.selectedBrandSlug === slug) return;
            handleBrandSelection(slug);
        });

        if (desktopContainer) desktopContainer.appendChild(btn);
        if (mobileContainer) mobileContainer.appendChild(mobileBtn);
    });
}

async function handleBrandSelection(slug) {
    brandState.selectedBrandSlug = slug;
    brandState.searchQuery = '';

    // update URL query
    const params = new URLSearchParams(window.location.search);
    params.set('brand', slug);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    await loadBrandBySlug(slug);
    renderBrandSidebar();
}

// ---------- RENDER: HEADER ----------

function renderBrandHeader() {
    const logoWrapper = document.getElementById('brandLogoWrapper');
    const titleEl = document.getElementById('brandTitle');
    const subtitleEl = document.getElementById('brandSubtitle');

    if (!logoWrapper || !titleEl || !subtitleEl) return;

    // fallback if nothing loaded yet
    const brand = brandState.selectedBrand || {};

    const name =
        brand.name ||
        brand.title ||
        (brandState.selectedBrandSlug ? brandState.selectedBrandSlug : 'Brand');

    const logo =
        brand.logo ||
        brand.logoUrl ||
        brand.logo_url ||
        brand.image ||
        brand.image_url
    brand.imageUrl ||
        null;

    const desc =
        brand.description ||
        'Explore professional products from this brand.';


    if (logo && !logo.startsWith('http') && !logo.startsWith('/')) {
        logo = '/' + logo;
    }
    // logo
    logoWrapper.innerHTML = '';
    if (logo) {
        const img = document.createElement('img');
        img.src = logo;
        img.alt = name;
        img.className = 'w-full h-full object-cover';
        logoWrapper.appendChild(img);
    } else {
        // fallback initials
        const span = document.createElement('span');
        span.textContent = name.charAt(0).toUpperCase();
        span.className = 'text-xl font-semibold text-slate-700';
        logoWrapper.appendChild(span);
    }

    // texts
    titleEl.textContent = name;
    subtitleEl.textContent = desc;

    // heading above products
    const headingEl = document.getElementById('brandProductsHeading');
    if (headingEl) {
        headingEl.textContent = `Products by ${name}`;
    }
}

// ---------- RENDER: PRODUCTS ----------  

function createBrandProductCard(product) {
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
                if (response.success) {
                    await updateCartCountByFetching();
                    showToast(response.message || 'Added to cart!', 'success');
                }
                else
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

function renderBrandProducts() {
    const container = document.getElementById('brandProductsContainer');
    if (!container) return;

    container.innerHTML = '';

    const list = brandState.filteredProducts || [];

    if (!list.length) {
        container.innerHTML =
            '<div class="col-span-full text-center py-12 text-slate-500">No products found for this brand</div>';
        return;
    }

    list.forEach(prod => {
        container.appendChild(createBrandProductCard(prod));
    });
}

// ---------- FILTER / SORT / SEARCH ON BRAND PAGE ----------

function setupBrandEventListeners() {
    const sortSelect = document.getElementById('brandSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            switch (val) {
                case 'price-asc':
                    brandState.filteredProducts.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
                    break;
                case 'price-desc':
                    brandState.filteredProducts.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
                    break;
                default:
                    brandState.filteredProducts = [...brandState.products];
            }
            renderBrandProducts();
        });
    }

    const searchInput = document.getElementById('brandSearchInput');
    const mobileSearchInput = document.getElementById('mobileBrandSearchInput');

    const handleSearch = (e) => {
        const value = e.target.value.trim().toLowerCase();
        brandState.searchQuery = value;

        // Sync inputs
        if (searchInput && e.target !== searchInput) searchInput.value = e.target.value;
        if (mobileSearchInput && e.target !== mobileSearchInput) mobileSearchInput.value = e.target.value;

        if (!value) {
            brandState.filteredProducts = [...brandState.products];
        } else {
            brandState.filteredProducts = brandState.products.filter(p => {
                const name = (p.name || p.productName || p.title || '').toLowerCase();
                return name.includes(value);
            });
        }
        renderBrandProducts();
    };

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleSearch);
}

function setupResponsiveEventListeners() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            mobileMenu.classList.toggle('show');
        });
    }

    if (mobileFilterBtn && mobileSidebar && sidebarOverlay) {
        mobileFilterBtn.addEventListener('click', () => {
            mobileSidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeSidebar = () => {
            mobileSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        sidebarOverlay.addEventListener('click', closeSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    }
}

function closeMobileSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (mobileSidebar) mobileSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = brandState.cartCount || 0;
    }
}

async function updateCartCountByFetching() {
    const resp = await productService.getCartCount();
    if (resp.success) {
        brandState.cartCount = resp.data.totalCartItems || 0;
        updateCartCount();
    } else {
        console.error("Failed to fetch cart count");
    }
}

document.getElementById('cartBtn').addEventListener('click', () => {
    window.location.href = 'cart.html';
});

document.addEventListener('DOMContentLoaded', initBrandPage);