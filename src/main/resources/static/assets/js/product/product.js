//state management for the product page

let state = {
    categories: [],
    brands: [],
    tags: [],
    products: [],
    filteredProducts: [],
    selectedCategory: null,
    selectedSubCategory: null, // { name, slug } when set
    selectedBrand: null,
    selectedTag: null,
    searchQuery: '',
};

function toSlug(str){
    if(!str) return '';
    return str 
    .toStrin()
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/^-+|-+$/g, '');
}

// simple helper to get an array from your API response
function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;                // { data: [...] }
    if (data && Array.isArray(data.content)) return data.content;  // { data: { content: [...] } }
    if (data && Array.isArray(data.products)) return data.products; // { data: { products: [...] } }

    return [];
}

//initializing the page

async function init() {
    try {
        //fetching all the data using productService
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

        //render all the components
        renderCategories();
        renderBrands();
        renderTags();
        renderProducts();

        // set search / sort / tags dropdown listeners
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

//setting event listeners
function setEventListeners() {
    //search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => handleSearch(e.target.value), 300);
        });
    }

    //sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    //tags ko dropdown
    const tagBtn = document.getElementById('tagsBtn');
    const tagMenu = document.getElementById('tagsMenu');
    if (tagBtn && tagMenu) {
        tagBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tagMenu.classList.toggle('active');
        });

        //close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!tagBtn.contains(e.target) && !tagMenu.contains(e.target)) {
                tagMenu.classList.remove('active');
            }
        });
    }
}

//handling search
async function handleSearch(query) {
    state.searchQuery = query.trim();

    //if kei search query cha
    if (state.searchQuery) {
        try {
            const searchResult = await productService.getSearchedProducts(state.searchQuery);
            let products = toArray(searchResult);

            // fallback to simple client-side search if backend returns empty
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

//handling sort 
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

//filter products based on selected filters
function filterProducts() {
    state.filteredProducts = state.products.filter(product => {
        let matchesCategory = true;
        let matchesBrand = true;
        let matchesTag = true;

        // derive slugs from product fields if backend doesn't provide them
        const prodCatName = product.category || '';
        const prodCatSlug = product.categorySlug || toSlug(prodCatName);

        const prodSubCatName = product.subCategory || product.subcategory || '';
        const prodSubCatSlug = product.subCategorySlug || product.subcategorySlug || toSlug(prodSubCatName);

        if (state.selectedSubCategory) {
            const subName = (state.selectedSubCategory.name || '').toLowerCase();
            const subSlug = (state.selectedSubCategory.slug || '').toLowerCase();

            matchesCategory =
                prodCatName.toLowerCase() === subName ||
                prodSubCatName.toLowerCase() === subName ||
                prodCatSlug === subSlug ||
                prodSubCatSlug === subSlug;
        } else if (state.selectedCategory) {
            const catSlug = state.selectedCategory.toLowerCase();
            matchesCategory =
                prodCatSlug === catSlug || prodSubCatSlug === catSlug;
        }

        if (state.selectedBrand) {
            const brandSlug = state.selectedBrand.toLowerCase();
            const prodBrandName = product.brand || '';
            const prodBrandSlug = product.brandSlug || toSlug(prodBrandName);
            matchesBrand =
                prodBrandSlug === brandSlug || prodBrandName.toLowerCase() === brandSlug;
        }

        if (state.selectedTag) {
            matchesTag = Array.isArray(product.tags) && product.tags.includes(state.selectedTag);
        }

        return matchesCategory && matchesBrand && matchesTag;
    });

    renderProducts();
}

//render recommended products (not implemented yet)
function renderRecommendedProducts() { }

//render tags function WITH dropdown + filtering
function renderTags() {
    const container = document.getElementById('tagsMenu');
    if (!container) return;

    container.innerHTML = '<div class="p-2"></div>';
    const tagsDiv = container.firstChild;

    if (!state.tags || state.tags.length === 0) {
        tagsDiv.innerHTML =
            '<p class="text-sm text-slate-500 text-center py-2">No tags available</p>';
        return;
    }

    state.tags.forEach(tag => {
        const tagName = tag.name || tag;
        const tagSlug = tag.slug || tagName;
        const isActive = state.selectedTag === tagSlug;

        const tagBtn = document.createElement('button');
        tagBtn.className = `
            w-full text-left px-4 py-2 rounded-lg text-sm transition-all
            ${isActive
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-slate-700 hover:bg-blue-50'}
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

                    // fallback to local filter
                    if (!tagProducts.length) {
                        tagProducts = state.products.filter(p =>
                            Array.isArray(p.tags) && p.tags.includes(tagSlug)
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

//rendering categories and subcategories
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!state.categories || state.categories.length === 0) {
        container.innerHTML =
            '<div class="text-center py-4 text-slate-500">No categories available</div>';
        return;
    }

    // find only top-level categories (parent_id / parentId is null)
    const parents = state.categories.filter(cat => {
        const parentId = cat.parentId ?? cat.parent_id;
        return parentId == null;
    });

    // show first 3 parents (Hair Care, Beard & Moustache, Color & Treatments)
    const displayCategories = parents.slice(0, 3);

    displayCategories.forEach(category => {
        const categoryDiv = document.createElement('div');

        const button = document.createElement('button');
        button.className =
            'w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-left group';

        const categoryName = category.name || category.title || category;
        const categorySlug = category.slug || categoryName;
        const categoryId = category.id ?? category.categoryId;

        button.innerHTML = `
            <span class="font-medium text-slate-700 group-hover:text-blue-600">${categoryName}</span>
            <svg class="text-slate-400 transition-transform chevron-${categorySlug.replace(/\s/g, '')}" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        `;

        //creating subcategory container
        const subDiv = document.createElement('div');
        subDiv.id = `sub-${categorySlug.replace(/\s/g, '')}`;
        subDiv.className = 'subcategory-enter ml-4 mt-2 space-y-1';

        button.addEventListener('click', () =>
            toggleCategory(categorySlug, categoryId, subDiv)
        );

        categoryDiv.appendChild(button);
        categoryDiv.appendChild(subDiv);
        container.appendChild(categoryDiv);
    });
}

// toggle category and fetch sub categories + filter products
function toggleCategory(categorySlug, categoryId, subDiv) {

    if (!subDiv) return;

    const chevron = document.querySelector(`.chevron-${categorySlug.replace(/\s/g, '')}`);

    // if click same category close
    if (state.selectedCategory === categorySlug && subDiv.classList.contains('active')) {
        subDiv.classList.remove('active');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        state.selectedCategory = null;
        state.selectedSubCategory = null;
        state.selectedTag = null;
        state.searchQuery = '';
        state.filteredProducts = [...state.products];
        renderProducts();
        return;
    }

    //close other categories
    document.querySelectorAll('.subcategory-enter').forEach(function (el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('[class*="chevron-"]').forEach(function (el) {
        el.style.transform = 'rotate(0deg)';
    });

    //set selected category
    state.selectedCategory = categorySlug;
    state.selectedSubCategory = null;
    state.selectedTag = null;
    state.selectedBrand = null;
    state.searchQuery = '';

    // find subcategories using parent_id / parentId = this parent's id (1,2,3)
    const subcategories = state.categories.filter(cat => {
        const pid =
            cat.parentId ??
            cat.parent_id ??
            cat.parentCategoryId;
        return pid === categoryId;
    });

    subDiv.innerHTML = '';

    if (subcategories.length > 0) {
        subcategories.forEach(subcat => {
            const subName = subcat.name || subcat.title;
            const subSlug = subcat.slug || toSlug(subName);

            const subButton = document.createElement('button');
            subButton.className =
                'block w-full text-left px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all';
            subButton.textContent = subName;
            subButton.addEventListener('click', function (e) {
                e.stopPropagation();
                // pass BOTH name and slug so filtering can match whatever backend uses
                selectSubcategory({ name: subName, slug: subSlug });
            });
            subDiv.appendChild(subButton);
        });

        subDiv.classList.add('active');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        // If no subcategories, just filter by main category using slug
        state.selectedSubCategory = null;
        filterProducts();
    }
}

// Select subcategory and filter products
function selectSubcategory(subcategory) {
    state.selectedSubCategory = subcategory;
    state.selectedTag = null;
    state.searchQuery = '';
    filterProducts();
}

//rendering brands
function renderBrands() {
    const container = document.getElementById('brandsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!state.brands || state.brands.length === 0) {
        container.innerHTML =
            '<div class="text-center py-4 text-slate-500">No brands available</div>';
        return;
    }

    state.brands.forEach(brand => {
        const brandName = brand.name || brand.title || brand;
        const brandSlug = brand.slug || brandName;

        const btn = document.createElement('button');
        btn.className =
            'w-full px-4 py-3 rounded-xl text-left text-slate-700 hover:bg-blue-50 transition-all';
        btn.textContent = brandName;

        // when clicking on brands go to another page
        btn.addEventListener('click', () => {
            const slugParam = encodeURIComponent(brandSlug);
            window.location.href = `brand.html?brand=${slugParam}`;
        });

        container.appendChild(btn);
    });
}

//creating product card
function createProductCard(product) {

    const productCard = document.createElement('div');
    productCard.className =
        'bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 cursor-pointer flex flex-col h-full';

    // backend fields
    const productImage = product.image || product.imageUrl || '📦';
    const productId = product.id || product._id;

    // fetch name as backend gives it
    const productName =
        product.name ||
        product.productName ||
        product.title ||
        'Product';

    //fetch price exactly as backend sends it
    const priceValue = product.price;  // <- no conversion, no modification

    const isEmoji =
        typeof productImage === 'string' &&
        !productImage.includes('/') &&
        productImage.length <= 4;

    productCard.innerHTML = `
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

    // when clicking on products go to details page
    productCard.addEventListener('click', (e) => {

        // prevent redirect if button clicked
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

    return productCard;
}

// update heading text above products grid based on current filters
function updateProducsHeading() {
    const headingEl = document.getElementById('productsHeading');
    if (!headingEl) return;

    let text = 'All Products';
    if (state.selectedTag) {
        const tagSlug = state.selectedTag;
        const tagObj = state.tags.find(
            function (t) {
                return (t.slug || t.name || t) === tagSlug;
            }
        );
        const tagName = (tagObj && (tagObj.name || tagObj.title)) || tagSlug;
        text = 'Products tagged "' + tagName + '"';
    } else if (state.selectedSubCategory) {
        const subName = state.selectedSubCategory.name || state.selectedSubCategory.slug;
        text = 'Products in "' + subName + '"';
    } else if (state.selectedCategory) {
        const catSlug = state.selectedCategory;
        const catObj = state.categories.find(
            function (c) {
                return (c.slug || c.name || c.title) === catSlug;
            }
        );
        const catName = (catObj && (catObj.name || catObj.title)) || catSlug;
        text = 'Products in "' + catName + '"';
    } else if (state.searchQuery) {
        text = 'Results for "' + state.searchQuery + '"';
    }

    headingEl.textContent = text;
}

//rendering products
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    updateProducsHeading();

    container.innerHTML = '';

    if (!state.filteredProducts || state.filteredProducts.length === 0) {
        container.innerHTML =
            '<div class="col-span-full text-center py-12 text-slate-500">No products found</div>';
        return;
    }

    state.filteredProducts.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);