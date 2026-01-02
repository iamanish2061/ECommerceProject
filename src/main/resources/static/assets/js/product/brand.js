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
            cartService.getCartCount()
        ])
        brandState.brands = toArray(brandsRes);
        if(cartResp.success){
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
    const container = document.getElementById('brandsSidebarContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!brandState.brands || brandState.brands.length === 0) {
        container.innerHTML =
            '<div class="text-center py-4 text-slate-500 text-sm">No brands available</div>';
        return;
    }

    brandState.brands.forEach(brand => {
        const name = brand.name;
        const slug = brand.slug.toLowerCase();
        const isActive = slug === brandState.selectedBrandSlug;

        const btn = document.createElement('button');
        btn.className =
            'w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm ' +
            (isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'hover:bg-blue-50 text-slate-700');

        btn.innerHTML = `<span class="truncate">${name}</span>`;

        btn.addEventListener('click', async () => {
            if (brandState.selectedBrandSlug === slug) return;

            brandState.selectedBrandSlug = slug;
            brandState.searchQuery = '';

            // update URL query (so refresh keeps the selected brand)
            const params = new URLSearchParams(window.location.search);
            params.set('brand', slug);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);

            await loadBrandBySlug(slug);
            renderBrandSidebar();
        });

        container.appendChild(btn);
    });
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


    if(logo && !logo.startsWith('http') && !logo.startsWith('/')){
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
    productCard.className =
        'bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer flex flex-col h-full';

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
        <div class="relative">
            <div class="bg-gray-50 h-64 flex items-center justify-center overflow-hidden">
                ${imageUrl 
                    ? `<img src="${imageUrl}" alt="${productName}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                         onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'; this.onerror=null;">`
                    : `<div class="text-6xl text-gray-300">📦</div>`
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
                showToast('Adding to cart...', 'info');
                const response = await productService.addToCart(productId);
                if(response.success){
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
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            const value = e.target.value.trim().toLowerCase();
            brandState.searchQuery = value;

            timeoutId = setTimeout(() => {
                if (!value) {
                    brandState.filteredProducts = [...brandState.products];
                } else {
                    brandState.filteredProducts = brandState.products.filter(p => {
                        const name = (p.name || p.productName || p.title || '').toLowerCase();
                        return name.includes(value);
                    });
                }
                renderBrandProducts();
            }, 300);
        });
    }
}

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = brandState.cartCount || 0;
    }
}

async function updateCartCountByFetching() {
    const resp = await cartService.getCartCount();
    if(resp.success){
        brandState.cartCount = resp.data.totalCartItems || 0;
        updateCartCount();
    }else{
        console.error("Failed to fetch cart count");
    }
}

document.getElementById('cartBtn').addEventListener('click', () => {
    window.location.href = 'cart.html';
});

document.addEventListener('DOMContentLoaded', initBrandPage);