let cartState = {
    items: [],
    total: 0,
    totalCartItems: 0,
};

function toArray(res) {
    if (!res) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.products)) return data.products;

    return [];
}

//initialze cart page
async function initCart() {
    try {
        const [cartItemRes, cartCountRes] = await Promise.all([
            cartService.getAllCartItems(),
            cartService.getCartCount()
        ]);

        cartState.items = toArray(cartItemRes);
        if (cartCountRes && cartCountRes.success) {
            cartState.totalCartItems = cartCountRes.data.totalCartItems || 0;
        }

        loadCartItems();
        updateCartCount();

        setupCartEventListeners();
    } catch (error) {
        console.error('Erro initializing cart', error);
        showToast('Refresh the cart page', 'error');
    }
}

//setting up event listeners
function setupCartEventListeners() {
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', handleClearCart);
    }
}

//first load all cart items
function loadCartItems() {
    try {
        if (cartState.items && cartState.items.length > 0) {
            renderCartItems();
            calculateTotal();
        } else {
            showEmptyCart();
        }
    } catch (error) {
        console.error('Error loading cart', error);
        showEmptyCart();
        showToast(error + " Error in loading cart", "error");
    }
}

//update cart counter
function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement)
        countElement.textContent = cartState.totalCartItems || 0;
    else {
        console.error("Failed to fetch cart count");
    }
}

//render cart items
function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const emptyState = document.getElementById('emptyCartState');

    if (!container) return;

    container.innerHTML = '';
    emptyState.style.display = 'none';

    cartState.items.forEach(item => {
        const cartItem = createCartItemElement(item);
        container.appendChild(cartItem);
    })
}

//creating a cart element for displaying
function createCartItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex flex-row gap-4 py-4 border-b border-slate-100 last:border-b-0 group';
    itemDiv.id = `cart-Item${item.product_id || item.product.id}`;

    const product = item.product;
    const productImage = product.imageUrl || product.image || '📦';
    const isEmoji = productImage.length <= 2;
    const productId = product.id;
    const itemPrice = product.price || 0;
    const itemQuantity = item.quantity || 1;

    itemDiv.innerHTML = `
    <!-- Product Image -->
    <div class="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 p-2">
        ${isEmoji
            ? `<div class="w-full h-full flex items-center justify-center text-4xl">${productImage}</div>`
            : `<img src="${productImage}" alt="${product.name}" class="w-full h-full object-contain">`
        }
    </div>

    <!-- Product Details -->
    <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
            <h3 class="text-lg font-bold text-slate-800 mb-1 truncate" title="${product.title || product.name}">${product.title || product.name}</h3>
            <p class="text-slate-500 text-sm mb-3 line-clamp-1">${product.shortDescription || product.description || ''}</p>
            <p class="text-xl font-bold text-blue-600">Rs. ${itemPrice.toLocaleString()}</p>
        </div>

        <!-- Quantity Controls & Remove -->
        <div class="flex items-center gap-4 mt-3">
            <div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                <button class="quantity-btn text-slate-400 hover:text-blue-600 font-bold text-lg px-1" data-action="decrease" data-product-id="${productId}">
                    −
                </button>
                <input 
                    type="number" 
                    value="${itemQuantity}" 
                    min="1" 
                    max="99"
                    class="quantity-input w-10 text-center bg-transparent border-none outline-none font-bold text-sm text-slate-700"
                    data-product-id="${productId}"
                />
                <button class="quantity-btn text-slate-400 hover:text-blue-600 font-bold text-lg px-1" data-action="increase" data-product-id="${productId}">
                    +
                </button>
            </div>

            <div class="flex items-center gap-4">
                <button class="save-btn text-emerald-500 hover:text-emerald-700 font-bold text-sm flex items-center gap-1 transition-colors" data-product-id="${productId}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Save
                </button>

                <button class="remove-btn text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-1 transition-colors" data-product-id="${productId}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Remove
                </button>
            </div>
        </div>
    </div>

    <!-- Item Total -->
    <div class="text-right flex flex-col justify-center min-w-[120px]">
        <p class="text-xs text-slate-400 mb-0.5">Item Total</p>
        <p class="text-xl font-bold text-slate-800">Rs. ${(itemPrice * itemQuantity).toLocaleString()}</p>
    </div>
`;


    //adding event listeners
    const increaseButton = itemDiv.querySelector('[data-action="increase"]');
    const decreaseButton = itemDiv.querySelector('[data-action="decrease"]');
    const quantityInput = itemDiv.querySelector('.quantity-input');
    const removeBtn = itemDiv.querySelector('.remove-btn');
    const saveBtn = itemDiv.querySelector('.save-btn');

    // IMPORTANT: null-safety so it doesn't crash
    if (increaseButton && quantityInput) {
        increaseButton.addEventListener('click', () => {
            const current = parseInt(quantityInput.value, 10) || 1;
            const next = Math.min(99, current + 1);
            quantityInput.value = next; // UI ONLY
        });
    }

    if (decreaseButton && quantityInput) {
        decreaseButton.addEventListener('click', () => {
            const current = parseInt(quantityInput.value, 10) || 1;
            const next = Math.max(1, current - 1);
            quantityInput.value = next; // UI ONLY
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10) || 1;
            if (val < 1) val = 1;
            if (val > 99) val = 99;
            e.target.value = val; // UI ONLY
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => handleRemoveItem(productId));
    }

    // NEW: Save button -> hits endpoint
    if (saveBtn) {
        saveBtn.addEventListener('click', () => saveCartItem(productId));
    }

    return itemDiv;
}

async function saveCartItem(productId) {
    const item = cartState.items.find(i => i.product.id === productId);
    if (!item) return

    //read the input 
    const input = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);
    const newQuantity = parseInt(input?.value, 10) || 1;

    if (newQuantity < 1) {
        showToast("Quantity must be at least 1", "error");
        return;
    }

    try {
        const response = await cartService.updateCartItem(productId, newQuantity);

        if (!response.success) {
            showToast("Failed to save quantity", "error");
            return;
        }

        //commit the saved quantity
        item.quantity = newQuantity;

        //update the item total
        const itemElement = document.getElementById(`cart-Item${productId}`);
        if (itemElement) {
            itemElement.replaceWith(createCartItemElement(item));
        }

        calculateTotal();
        updateCartCount();

        showToast("Saved quantity successfullly", "success");

    } catch (error) {
        console.error("Network erro failed to save quantity", error);
        showToast("Network error", "error");
    }

}

//Handle remove item
async function handleRemoveItem(productId) {
    if (!confirm("Are you sure you want to remove this item from you cart?")) {
        return
    }

    try {
        const response = await cartService.deleteCartItem(productId);

        if (!response.success) {
            showToast('Failed to remove item', 'error');
            loadCartItems();
        }
        cartState.items = cartState.items.filter(i => (i.product.id || i.product._id) !== productId);
        cartState.totalCartItems -= 1;
        renderCartItems();
        calculateTotal();
        updateCartCount();
        showToast('Item removed from cart', 'success');
    } catch (error) {
        console.error("Network error Please try again later", error);
        alert("Network error failed to remove item");
        loadCartItems();
    }
}

//calculate total and update order summary
function calculateTotal() {
    const productPriceList = document.getElementById('productPricesList');
    const totalEl = document.getElementById('total');

    if (!productPriceList) return;

    productPriceList.innerHTML = '';
    cartState.total = 0;

    cartState.items.forEach(item => {
        const product = item.product;
        const price = product.price || 0;
        const quantity = item.quantity || 1;
        const itemTotal = price * quantity;

        cartState.total += itemTotal;

        //create product price row
        const priceRow = document.createElement('div');
        priceRow.className = 'flex justify-between items-start gap-4 text-sm text-slate-600';
        priceRow.innerHTML = `
            <span class="flex-1 truncate">${product.title || product.name} <span class="text-slate-400 font-normal">× ${quantity}</span></span>
            <span class="font-bold text-slate-800 whitespace-nowrap">Rs. ${itemTotal.toLocaleString()}</span>
        `;

        productPriceList.appendChild(priceRow);
    });

    if (totalEl) {
        totalEl.textContent = `Rs.${cartState.total.toFixed(2)}`;
    }
}

//show empty cart state
function showEmptyCart() {
    const container = document.getElementById('cartItemsContainer');
    const emptyState = document.getElementById('emptyCartState');
    const productPricesList = document.getElementById('productPricesList');
    const totalEl = document.getElementById('total');

    if (container) container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (productPricesList) productPricesList.innerHTML = '';
    if (totalEl) totalEl.textContent = 'Rs.0';

    cartState.items = [];
    cartState.total = 0;
}

//Handle checkout
function handleCheckout() {
    if (cartState.items.length === 0) {
        showToast("Your cart is empty", "error");
        return;
    }
    showToast("Proceeding to checkout...", "info");
    setTimeout(() => {
        window.location.href = 'checkoutCart.html?total=' + cartState.total;
    }, 500);
}

//handle clear cart
async function handleClearCart() {
    if (!confirm("Are you sure you want to clear you entire cart")) {
        return;
    }

    cartState.items = [];
    cartState.totalCartItems = 0;
    showEmptyCart();

    try {
        const res = await cartService.deleteAllCartItems();
        if (res.success) {
            showToast("Cart cleared!", "success");
            loadCartItems();
            updateCartCount();
        }
    } catch (err) {
        console.error("Error clearing cart", err);
        alert("Network error failed to clear cart");
    }
}

// Start app
document.addEventListener('DOMContentLoaded', initCart);