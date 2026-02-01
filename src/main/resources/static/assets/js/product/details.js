// State
let detailsState = {
    product: null,
    currentImageIndex: 0,
    cartCount: 0,
    categories: [],
    brands: []
};

// Get product ID from URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("id");
    return raw ? decodeURIComponent(raw) : null;
}

// Extract product from API response
function extractProduct(res) {
    if (!res || !res.data) return null;
    const data = res.data;
    if (data.product) return data.product;
    if (data.item) return data.item;
    if (Array.isArray(data)) return data[0];
    return data;
}

function showDetailsError(message) {
    const main = document.querySelector("main");
    if (!main) return;
    main.innerHTML = `
        <div class="bg-white shadow-md rounded-3xl max-w-md mx-auto mt-16 p-10 text-center">
            <p class="text-red-500 mb-5 text-lg">${message}</p>
            <a href="product.html" class="px-8 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700">
                Back to Products
            </a>
        </div>
    `;
}

// Init page
async function initDetailsPage() {
    const id = getProductIdFromUrl();
    if (!id) {
        showDetailsError("No product selected.");
        return;
    }

    try {
        const [res, cartResp, catResp, brandResp] = await Promise.all([
            productService.getProductsById(id),
            productService.getCartCount(),
            productService.getProductsByCategory(),
            productService.getProductsByBrandDetails()
        ])

        if (!res || res.success === false) {
            showDetailsError(res?.message || "Failed to load product.");
            return;
        }
        if (cartResp.success) {
            detailsState.cartCount = cartResp.data.totalCartItems || 0;
        }

        if (catResp.success) detailsState.categories = catResp.data || [];
        if (brandResp.success) detailsState.brands = brandResp.data || [];

        const product = extractProduct(res);
        if (!product) {
            showDetailsError("Product not found.");
            return;
        }
        detailsState.product = product;
        renderDetails(product);
        renderMobileSidebar();
        updateCartCount();
        setEventListeners();
    } catch (err) {
        console.error("Error loading product:", err);
        showDetailsError("Error loading product. Please try again.");
    }
}

// Render product details
function renderDetails(product) {
    const images = product.images || [];
    const thumbnailImg = images.find(img => img.thumbnail) || images[0] || null;
    detailsState.currentImageIndex = images.findIndex(img => img.thumbnail);
    if (detailsState.currentImageIndex === -1) detailsState.currentImageIndex = 0;

    // Main Image
    const mainImg = document.getElementById('productImageMain');
    const noImg = document.getElementById('noImageFallback');
    if (thumbnailImg) {
        mainImg.src = thumbnailImg.url;
        mainImg.alt = product.title;
        mainImg.classList.remove('hidden');
        noImg.classList.add('hidden');
    } else {
        mainImg.classList.add('hidden');
        noImg.classList.remove('hidden');
    }

    // Text
    document.getElementById('productTitle').textContent = product.title || 'Untitled';
    document.getElementById('productShortDescription').textContent = product.shortDescription || '';
    document.getElementById('productDescription').textContent = product.description || 'No description available.';
    document.getElementById('productPrice').textContent = product.price ? `Rs. ${product.price}` : 'Price on request';
    document.getElementById('detailsSku').textContent = product.sku || '-';
    document.getElementById('detailsSize').textContent = product.sizeMl || '-';
    document.getElementById('detailsStock').textContent = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';

    // Brand
    const brandContainer = document.getElementById('detailsBrand');
    const brand = product.brand;
    if (brandContainer && brand) {
        brandContainer.innerHTML = `
            <div class="flex items-center gap-1.5">
                ${brand.logoUrl
                ? `<img src="${brand.logoUrl}" alt="${brand.name}" class="w-8 h-8 object-contain rounded border">`
                : `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center border">
                         <span class="text-sm font-bold text-gray-600">${brand.name.charAt(0)}</span>
                       </div>`
            }
                <span class="font-semibold text-base text-slate-800">${brand.name}</span>
            </div>
        `;
    }

    // Category
    document.getElementById('detailsCategory').textContent = product.category?.name || 'Uncategorized';

    // Tags
    const tagsContainer = document.getElementById('detailsTagsContainer');
    tagsContainer.innerHTML = '';
    if (product.tags?.length > 0) {
        product.tags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider';
            chip.textContent = tag.name || tag.slug;
            tagsContainer.appendChild(chip);
        });
    } else {
        tagsContainer.innerHTML = '<span class="text-gray-500 text-sm">No tags</span>';
    }

    // Image Thumbnails
    const thumbnails = document.getElementById('imageThumbnails');
    thumbnails.innerHTML = '';
    if (images.length > 1) {
        images.forEach((img, i) => {
            const thumb = document.createElement('div');
            thumb.className = `cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${i === detailsState.currentImageIndex ? 'border-blue-600 shadow-sm' : 'border-transparent'}`;
            thumb.innerHTML = `<img src="${img.url}" alt="${img.altText || product.title}" class="w-full h-20 object-cover">`;
            thumb.onclick = () => {
                mainImg.src = img.url;
                detailsState.currentImageIndex = i;
                updateThumbnails();
            };
            thumbnails.appendChild(thumb);
        });
    }

    function updateThumbnails() {
        const thumbs = thumbnails.querySelectorAll('div');
        thumbs.forEach((t, i) => {
            const active = i === detailsState.currentImageIndex;
            t.classList.toggle('border-blue-600', active);
            t.classList.toggle('shadow-md', active);
            t.classList.toggle('border-transparent', !active);
        });
    }

    // Prev/Next Buttons
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');

    const changeImage = (dir) => {
        if (images.length <= 1) return;
        detailsState.currentImageIndex = (detailsState.currentImageIndex + dir + images.length) % images.length;
        mainImg.src = images[detailsState.currentImageIndex].url;
        updateThumbnails();
    };

    if (prevBtn) prevBtn.onclick = () => changeImage(-1);
    if (nextBtn) nextBtn.onclick = () => changeImage(1);

    prevBtn.classList.toggle('hidden', images.length <= 1);
    nextBtn.classList.toggle('hidden', images.length <= 1);

    // Buttons with Toast
    const addBtn = document.getElementById('detailsAddToCart');
    const buyBtn = document.getElementById('detailsBuyNow');

    if (addBtn) {
        addBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (product.stock <= 0) {
                showToast('Out of stock', 'error');
                return;
            }

            if (!AuthService.isAuthenticated()) {
                showToast('Please login to continue', 'error');
                return;
            }

            try {
                showToast('Adding to cart...', 'info');
                const response = await productService.addToCart(product.id);
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

    if (buyBtn) {
        buyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (product.stock === 0) return;

            if (!AuthService.isAuthenticated()) {
                showToast('Please login to continue', 'error');
                return;
            }

            try {
                showToast('Redirecting to checkout...', 'info');
                setTimeout(() => {
                    window.location.href = '/checkoutBuy.html?productId=' + encodeURIComponent(product.id);
                }, 500);

            } catch (err) {
                console.error('Buy now failed:', err);
                showToast('Could not proceed to buy', 'error');
            }
        });
    }
}

function renderMobileSidebar() {
    const catContainer = document.getElementById('mobileCategoriesContainer');
    const brandContainer = document.getElementById('mobileBrandsContainer');

    if (catContainer) {
        catContainer.innerHTML = detailsState.categories.map(cat => `
            <button onclick="window.location.href='product.html?category=${encodeURIComponent(cat.name)}'" 
                    class="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                ${cat.name}
            </button>
        `).join('') || '<p class="text-sm text-slate-400">No categories</p>';
    }

    if (brandContainer) {
        brandContainer.innerHTML = detailsState.brands.map(brand => `
            <button onclick="window.location.href='product.html?brand=${encodeURIComponent(brand.name)}'"
                    class="w-full text-left px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                ${brand.name}
            </button>
        `).join('') || '<p class="text-sm text-slate-400">No brands</p>';
    }
}

function setEventListeners() {
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

    // Sidebar Close
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


    // Profile toggle for mobile
    const profileWrap = document.getElementById('profileWrapper');
    if (profileWrap) {
        profileWrap.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                const dropdown = document.getElementById('profileDropdown');
                if (dropdown) dropdown.classList.toggle('active');
            }
        });
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

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = detailsState.cartCount || 0;
    }
}

async function updateCartCountByFetching() {
    const resp = await productService.getCartCount();
    if (resp.success) {
        detailsState.cartCount = resp.data.totalCartItems || 0;
        updateCartCount();
    } else {
        console.error("Failed to fetch cart count");
    }
}

// Start
document.addEventListener('DOMContentLoaded', initDetailsPage);