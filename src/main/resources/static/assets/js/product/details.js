// ---------- state ----------
let detailsState = {
    product: null
};

// read ?id= from URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("id");
    return raw ? decodeURIComponent(raw) : null;
}

// extract product object from API response
function extractProduct(res) {
    console.log("DETAILS raw response:", res);

    if (!res) return null;
    const data = res.data;
    if (!data) return null;

    // { data: { product: {...} } }
    if (data.product) return data.product;

    // { data: { item: {...} } }
    if (data.item) return data.item;

    // { data: [ {...}, ... ] }
    if (Array.isArray(data)) return data[0] || null;

    // { data: {...product fields...} }
    return data;
}

function showDetailsError(message) {
    const main = document.querySelector("main");
    if (!main) return;

    main.innerHTML = `
        <div class="bg-white shadow-md rounded-3xl max-w-md mx-auto mt-16 p-10 text-center">
            <p class="text-red-500 mb-5 text-sm">${message}</p>
            <a href="product.html"
               class="px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
               Back to Products
            </a>
        </div>
    `;
}

// init
async function initDetailsPage() {
    const id = getProductIdFromUrl();

    if (!id) {
        showDetailsError("No product selected.");
        return;
    }

    try {
        const res = await productService.getProductsById(id);

        if (!res || res.success === false) {
            showDetailsError(res?.message || "Failed to load product.");
            return;
        }

        const product = extractProduct(res);
        if (!product) {
            showDetailsError("Product not found.");
            return;
        }

        detailsState.product = product;
        console.log("DETAILS product object:", product);
        renderDetails(product);
    } catch (err) {
        console.error("Error loading product details:", err);
        showDetailsError("Error loading product details. Please try again.");
    }
}

// helper: get primary image from product.images or image fields
function getPrimaryImage(product) {
    // if single image field is present (same logic as product.js)
    if (product.image) return product.image;
    if (product.imageUrl) return product.imageUrl;
    if (product.image_url) return product.image_url;

    // else, use first entry from images[]
    if (Array.isArray(product.images) && product.images.length > 0) {
        const first = product.images[0];

        if (typeof first === "string") {
            return first;
        }

        // common object shapes
        return (
            first.url ||
            first.imageUrl ||
            first.image_url ||
            first.path ||
            first.src ||
            null
        );
    }

    return null;
}

// render details (image, name, price, sku, size, stock, descriptions, tags)
function renderDetails(product) {
    const productId = product.id || product._id;

    const productName =
        product.title ||
        product.name ||
        product.productName ||
        "Product";

    const fullDescription =
        product.description ||
        "";

    const shortDescription =
        product.shortDescription ||
        "";

    const priceValue = product.price || 0;
    const sku = product.sku || "-";
    const size =
        product.sizeML ??   // e.g. "sizeML"
        product.sizeMl ??   // e.g. "sizeMl"
        product.size_ml ??  // e.g. "size_ml"
        product.size ??
        product.volume ??
        "-";
    const stock =
        typeof product.stock === "number" ? product.stock : "-";

    const imageUrl = getPrimaryImage(product);

    // IMAGE
    const imgEl = document.getElementById("productImageMain");
    const fallbackEl = document.getElementById("noImageFallback");

    if (imgEl && fallbackEl) {
        if (imageUrl) {
            // use exactly as backend gives (same as product cards)
            imgEl.src = imageUrl;
            imgEl.alt = productName;
            imgEl.classList.remove("hidden");
            fallbackEl.classList.add("hidden");
        } else {
            imgEl.classList.add("hidden");
            fallbackEl.classList.remove("hidden");
        }
    }

    // BASIC TEXT
    const titleEl = document.getElementById("productTitle");
    const longDescEl = document.getElementById("productDescription");
    const shortDescEl = document.getElementById("productShortDescription");
    const priceEl = document.getElementById("productPrice");
    const skuEl = document.getElementById("detailsSku");
    const sizeEl = document.getElementById("detailsSize");
    const stockEl = document.getElementById("detailsStock");

    if (titleEl) titleEl.textContent = productName;
    if (longDescEl) longDescEl.textContent = fullDescription || "No description available.";
    if (shortDescEl) shortDescEl.textContent = shortDescription;
    if (priceEl) priceEl.textContent = `Rs. ${priceValue}`;
    if (skuEl) skuEl.textContent = sku;
    if (sizeEl) sizeEl.textContent = size;
    if (stockEl) stockEl.textContent = stock;

    // TAGS
    const tagsContainer = document.getElementById("detailsTagsContainer");
    if (tagsContainer) {
        tagsContainer.innerHTML = "";

        const tags = product.tags || [];
        if (Array.isArray(tags) && tags.length > 0) {
            tags.forEach(tag => {
                const tagName = tag.name || tag.slug || tag.label || tag;
                const chip = document.createElement("span");
                chip.className =
                    "px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs";
                chip.textContent = `#${tagName}`;
                tagsContainer.appendChild(chip);
            });
        } else {
            const chip = document.createElement("span");
            chip.className = "text-xs text-slate-400";
            chip.textContent = "No tags";
            tagsContainer.appendChild(chip);
        }
    }

    // BUTTONS (placeholder behaviour)
    const addToCartBtn = document.getElementById("detailsAddToCart");
    const buyNowBtn = document.getElementById("detailsBuyNow");

    if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
            console.log("Add to Cart clicked:", productId);
            // integrate cart here later
        });
    }

    if (buyNowBtn) {
        buyNowBtn.addEventListener("click", () => {
            console.log("Buy Now clicked:", productId);
            // redirect to checkout here later
        });
    }
}

// bootstrap
document.addEventListener("DOMContentLoaded", initDetailsPage);