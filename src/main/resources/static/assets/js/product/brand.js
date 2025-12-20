// ---------- STATE ----------

let brandState = {
    brands: [],
    selectedBrandSlug: null,
    selectedBrand: null,
    products: [],
    filteredProducts: [],
    searchQuery: ''
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
        const brandsRes = await productService.getProductsByBrandDetails();
        brandState.brands = toArray(brandsRes);

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

 //sort functionality
//     const sortSelect = document.getElementById('sortSelect');
//     if (sortSelect) {
//         sortSelect.addEventListener('change', handleSort);
//     }

//     //handling sort 
// function handleSort(e) {
//     const sortBy = e.target.value;

//     switch (sortBy) {
//         case 'price-asc':
//             state.filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
//             break;
//         case 'price-desc':
//             state.filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
//             break;
//         default:
//             state.filteredProducts = [...state.products];
//     }
//     renderProducts();
// }


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
        const name = brand.name || brand.title || brand;
        const slug = (brand.slug || toSlug(name)).toLowerCase();
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
    const card = document.createElement('div');
    card.className =
        'bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer flex flex-col h-full';

    const productImage = product.image || product.imageUrl || '📦';
    const productId = product.id || product._id;
    const productName =
        product.name ||
        product.productName ||
        product.title ||
        'Product';

    const priceValue = product.price; // use as backend sends it

    const isEmoji =
        typeof productImage === 'string' &&
        !productImage.includes('/') &&
        productImage.length <= 4;

    card.innerHTML = `
        <div class="flex-1">
            <div class="bg-white rounded-xl h-48 flex items-center justify-center mb-4 overflow-hidden">
                ${
                    isEmoji
                        ? `<span class="text-6xl">${productImage}</span>`
                        : `<img src="${productImage}" alt="${productName}" class="w-full h-full object-cover">`
                }
            </div>

            <h3 class="font-bold text-lg text-slate-800 mb-4">${productName}</h3>

            <div class="flex items-center justify-between mb-3">
                <span class="text-2xl font-bold text-blue-600">Rs. ${priceValue}</span>
            </div>
        </div>

        <div class="mt-auto flex gap-2">
            <button class="add-to-cart-btn flex-1 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2.5 rounded-full hover:bg-blue-50 transition-all font-medium text-sm" data-product-id="${productId}">
                Add to Cart
            </button>

            <button class="buy-now-btn flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-full hover:shadow-lg transition-all font-medium text-sm" data-product-id="${productId}">
                Buy Now
            </button>
        </div>
    `;

    // go to details page when card clicked (except buttons)
    card.addEventListener('click', (e) => {
        if (
            e.target.classList.contains('add-to-cart-btn') ||
            e.target.classList.contains('buy-now-btn') ||
            e.target.closest('.add-to-cart-btn') ||
            e.target.closest('.buy-now-btn')
        ) {
            return;
        }
        if (!productId) return;
        window.location.href = `details.html?id=${productId}`;
    });

    return card;
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

// ---------- BOOTSTRAP ----------

document.addEventListener('DOMContentLoaded', initBrandPage);