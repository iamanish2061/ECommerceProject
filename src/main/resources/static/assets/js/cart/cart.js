let cartState = {
    items: [],
    total: 0,
    totalCartItems: 0,
};

//toast
function showToast(message, type = "info", duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}

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
    itemDiv.className = 'flex flex-col sm:flex-row gap-6 p-6 border-b border-slate-200 last:border-b-0';
    itemDiv.id = `cart-Item${item.product_id || item.product.id}`;

    const product = item.product;
    const productImage = product.imageUrl || product.image || '📦';
    const isEmoji = productImage.length <= 2;
    const productId = product.id;
    const itemPrice = product.price || 0;
    const itemQuantity = item.quantity || 1;

    itemDiv.innerHTML = `
    <!-- Product Image -->
    <div class="w-full sm:w-32 h-32 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
        ${isEmoji
            ? `<div class="w-full h-full flex items-center justify-center text-5xl">${productImage}</div>`
            : `<img src="${productImage}" alt="${product.name}" class="w-full h-full object-cover">`
        }
    </div>

    <!-- Product Details -->
    <div class="flex-1 flex flex-col justify-between">
        <div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">${product.title || product.name}</h3>
            <p class="text-slate-600 text-sm mb-4 line-clamp-2">${product.shortDescription || product.description || ''}</p>
            <p class="text-2xl font-bold text-blue-600">Rs: ${itemPrice.toFixed(2)}</p>
        </div>

        <!-- Quantity Controls & Remove -->
        <div class="flex justify-around gap-6 mt-6">
            <div class="flex items-center gap-3 bg-slate-100 rounded-full px-4 py-2">
                <button class="quantity-btn text-slate-600 hover:text-blue-600 font-bold text-xl" data-action="decrease" data-product-id="${productId}">
                    −
                </button>
                <input 
                    type="number" 
                    value="${itemQuantity}" 
                    min="1" 
                    max="99"
                    class="quantity-input w-16 text-center bg-transparent border-none outline-none font-medium text-slate-800"
                    data-product-id="${productId}"
                />
                <button class="quantity-btn text-slate-600 hover:text-blue-600 font-bold text-xl" data-action="increase" data-product-id="${productId}">
                    +
                </button>
            </div>

            <button class="remove-btn text-red-500 hover:text-red-700 font-medium flex items-center gap-2 transition-colors" data-product-id="${productId}">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Remove
            </button>

            <button class="save-btn text-green-500 hover:text-green-700 font-medium flex items-center gap-2 transition-colors" data-product-id="${productId}">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Save
            </button>
        </div>
    </div>

    <!-- Item Total -->
    <div class="text-right">
        <p class="text-sm text-slate-500 mb-1">Item Total</p>
        <p class="text-2xl font-bold text-slate-800">Rs.${(itemPrice * itemQuantity).toFixed(2)}</p>
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
        priceRow.className = 'flex justify-between text-slate-700 py-1';
        priceRow.innerHTML = `
            <span class="flex-1 truncate pr-2">${product.title || product.name} (x${quantity})</span>
            <span class="font-medium">Rs.${itemTotal.toFixed(2)}</span>
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