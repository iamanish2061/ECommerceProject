// State management for orders page
let state = {
    orders: [],
    cartCount: 0
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Initialize the page
async function init() {
    try {
        // Show loading state
        const container = document.getElementById('ordersList');
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p class="text-slate-500 ml-4 font-medium">Loading your orders...</p>
                </div>
            `;
        }

        const [ordersRes, cartRes] = await Promise.all([
            orderService.getOrderHistory(),
            productService.getCartCount()
        ]);

        if (ordersRes.success) {
            state.orders = ordersRes.data || [];
        }

        if (cartRes.success) {
            state.cartCount = cartRes.data.totalCartItems || 0;
        }

        renderOrderHistory();
        updateCartCount();

    } catch (error) {
        console.error('Error initializing orders page:', error);
        showToast("Failed to load orders. Please reload the page.", "error");
    }
}

function updateCartCount() {
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = state.cartCount;
    }
}

async function renderOrderHistory() {
    const container = document.getElementById('ordersList');
    if (!container) return;

    if (state.orders && state.orders.length > 0) {
        container.innerHTML = "";
        state.orders.forEach(order => {
            const orderCard = createOrderCard(order);
            container.insertAdjacentHTML('beforeend', orderCard);
        });
    } else {
        container.innerHTML = `
            <div class="text-center py-20 px-6">
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <svg class="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-3">Your Journey Awaits</h3>
                <p class="text-slate-500 mb-10 max-w-sm mx-auto font-medium">It looks like you haven't placed any orders yet. Explore our curated collections and start your premium shopping experience today!</p>
                <a href="product.html" class="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-bold hover:bg-blue-600 transition-all duration-300 shadow-2xl shadow-slate-200 hover:shadow-blue-200 hover:-translate-y-1">
                    Discover Products
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7-7 7"/></svg>
                </a>
            </div>
        `;
    }
}

function createOrderCard(order) {
    const statusInfo = getStatusStyle(order.status);
    const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="group w-full bg-white rounded-[1.5rem] p-5 shadow-sm hover:shadow-lg transition-all duration-500 border border-slate-100/80 flex flex-col md:flex-row items-center justify-between gap-5">
            <div class="flex items-center gap-5 w-full md:w-auto">
                <div class="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <div class="min-w-0">
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em] leading-none mb-1.5">Order ID: #${order.orderId}</p>
                    <p class="font-bold text-slate-800 text-base truncate">${date}</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 w-full md:w-auto md:flex-1 md:justify-center">
                <span class="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusInfo.bgClass} ${statusInfo.textClass} shadow-sm">
                    ${order.status}
                </span>
            </div>

            <div class="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
                <div class="text-right">
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em] leading-none mb-1.5">Total Amount</p>
                    <p class="text-xl font-black text-blue-600">Rs. ${order.totalAmount.toFixed(2).toLocaleString()}</p>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="viewOrderDetail('${order.orderId}')" 
                        class="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-blue-200 hover:-translate-y-1">
                        View Details
                    </button>
                    ${['PENDING', 'CONFIRMED'].includes(order.status.toUpperCase()) ? `
                        <button onclick="event.stopPropagation(); handleCancelOrder('${order.orderId}')" 
                            class="px-5 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-100 hover:border-red-600 hover:-translate-y-1">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

async function viewOrderDetail(orderId) {
    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Reset popup content
    document.getElementById('popupOrderId').textContent = orderId;
    document.getElementById('popupStatus').textContent = 'Loading...';
    document.getElementById('popupItemsContainer').innerHTML = `
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    `;

    try {
        const response = await orderService.getOrderDetail(orderId);
        if (response.success) {
            populateOrderDetailModal(response.data);
        } else {
            showToast("Failed to load order details", "error");
            closeOrderDetailModal();
        }
    } catch (err) {
        console.error('Error fetching order detail:', err);
        showToast("Error loading order details", "error");
        closeOrderDetailModal();
    }
}

function populateOrderDetailModal(order) {
    const statusInfo = getStatusStyle(order.status);
    const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Update Status UI
    const statusText = document.getElementById('popupStatus');
    const statusBg = document.getElementById('popupStatusBg');

    statusText.textContent = order.status;
    statusText.className = `font-bold ${statusInfo.textClass} capitalize`;
    statusBg.className = `p-3 rounded-full ${statusInfo.bgClass} ${statusInfo.textClass}`;

    document.getElementById('popupDate').textContent = date;

    const paymentMethodEl = document.getElementById('popupPaymentMethod');
    const paymentStatusEl = document.getElementById('popupPaymentStatus');

    if (order.payment) {
        paymentMethodEl.textContent = order.payment.paymentMethod.replace(/_/g, ' ');
        paymentStatusEl.textContent = `Status: ${order.payment.paymentStatus || 'N/A'}`;
        if (order.payment.transactionId) {
            paymentStatusEl.textContent += ` | Ref: ${order.payment.transactionId}`;
        }
    } else {
        paymentMethodEl.textContent = 'Cash on Delivery';
    }

    document.getElementById('popupTotal').textContent = `Rs. ${order.totalAmount.toFixed(2).toLocaleString()}`;

    // Handle Cancel Button in Modal
    const modalActionContainer = document.getElementById('modalActionContainer');
    if (modalActionContainer) {
        const isCancellable = ['PENDING', 'CONFIRMED'].includes(order.status.toUpperCase());
        if (isCancellable) {
            modalActionContainer.classList.remove('hidden');
            const cancelBtn = document.getElementById('modalCancelBtn');
            if (cancelBtn) {
                cancelBtn.onclick = () => handleCancelOrder(order.orderId);
            }
        } else {
            modalActionContainer.classList.add('hidden');
        }
    }

    // Address Info
    const address = order.address;
    document.getElementById('popupAddress').innerHTML = `
        <p class="font-bold text-slate-800">${address.place}</p>
        <p>${address.landmark}</p>
        <p>${address.district}, ${address.province}</p>
        <p class="mt-2 flex items-center gap-2 text-indigo-600 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            ${order.phoneNumber}
        </p>
    `;

    // Items
    const itemsContainer = document.getElementById('popupItemsContainer');
    itemsContainer.innerHTML = "";

    order.orderItems.forEach(item => {
        const product = item.product;
        const imageUrl = product.imageUrl || 'assets/svg/CutLab.svg';

        const itemHtml = `
            <div class="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-slate-100/50 flex-shrink-0">
                    <img src="${imageUrl}" alt="${product.title || product.name}" class="w-full h-full object-contain">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-bold text-slate-800 truncate">${product.title || product.name}</p>
                    <div class="flex justify-between items-center mt-1">
                        <p class="text-[11px] font-medium text-slate-500">Qty: ${item.quantity} × Rs. ${item.price.toFixed(2)}</p>
                        <p class="text-[13px] font-bold text-blue-600">Rs. ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        `;
        itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

async function handleCancelOrder(orderId) {
    if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) return;

    try {
        showToast("Cancelling order...", "info");
        const response = await orderService.cancelOrder(orderId);

        if (response.success) {
            showToast("Order cancelled successfully", "success");
            // If modal is open, update its status or close it
            const modal = document.getElementById('orderDetailModal');
            if (modal && !modal.classList.contains('hidden')) {
                // Refresh detail if modal is open
                const detailResponse = await orderService.getOrderDetail(orderId);
                if (detailResponse.success) {
                    populateOrderDetailModal(detailResponse.data);
                }
            }
            // Refresh order history and cart count to update everything
            await init();
        } else {
            showToast(response.message || "Failed to cancel order", "error");
        }
    } catch (err) {
        console.error('Error cancelling order:', err);
        showToast("Error cancelling order", "error");
    }
}

function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function getStatusStyle(status) {
    switch (status.toUpperCase()) {
        case 'DELIVERED':
            return {
                bgClass: 'bg-emerald-50',
                textClass: 'text-emerald-600',
                icon: 'check-circle'
            };
        case 'CANCELLED':
            return {
                bgClass: 'bg-red-50',
                textClass: 'text-red-600',
                icon: 'x-circle'
            };
        case 'PROCESSING':
            return {
                bgClass: 'bg-blue-50',
                textClass: 'text-blue-600',
                icon: 'clock'
            };
        case 'SHIPPED':
            return {
                bgClass: 'bg-indigo-50',
                textClass: 'text-indigo-600',
                icon: 'truck'
            };
        default:
            return {
                bgClass: 'bg-slate-50',
                textClass: 'text-slate-600',
                icon: 'package'
            };
    }
}

// Close modal on click outside
window.onclick = function (event) {
    const modal = document.getElementById('orderDetailModal');
    if (event.target == modal) {
        closeOrderDetailModal();
    }
}

