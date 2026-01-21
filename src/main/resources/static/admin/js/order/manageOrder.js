const OrderUI = {
    openModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('modal-active');
        }
    },

    closeModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.classList.remove('modal-active');
        }
    },

    getStatusStyle: (status) => {
        switch ((status || '').toUpperCase()) {
            case 'DELIVERED':
                return { bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' };
            case 'CANCELLED':
                return { bgClass: 'bg-red-50', textClass: 'text-red-600', badgeBg: 'bg-red-100', badgeText: 'text-red-700' };
            case 'PROCESSING':
                return { bgClass: 'bg-blue-50', textClass: 'text-blue-600', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' };
            case 'SHIPPED':
                return { bgClass: 'bg-indigo-50', textClass: 'text-indigo-600', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-700' };
            case 'PENDING':
                return { bgClass: 'bg-yellow-50', textClass: 'text-yellow-600', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700' };
            case 'CONFIRMED':
                return { bgClass: 'bg-cyan-50', textClass: 'text-cyan-600', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-700' };
            default:
                return { bgClass: 'bg-slate-50', textClass: 'text-slate-600', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700' };
        }
    }
};

const OrderManager = {
    allOrders: [],
    statusList: [],
    currentOrderId: null,

    async init() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.handleLogout);
        await this.loadOrders();
        await this.loadStatusList();
        this.setupFilters();
    },

    async handleLogout() {
        if (!confirm('Are you sure you want to logout?')) return;

        try {
            // Try to call logout API if AuthService exists
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
                const response = await AuthService.logout();
                if (response?.success) {
                    showToast('Logged out successfully', 'success');
                    setTimeout(() => {
                        window.location.href = '/auth/login.html';
                    }, 500);
                } else {
                    showToast('Failed to log out', 'error');
                }
            } else {
                console.log("auth service not defined");
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async loadOrders() {
        showToast("Loading orders...", "info");
        try {
            const res = await OrderService.getAllOrders();
            if (res.success) {
                this.allOrders = res.data || [];
                this.renderOrders(this.allOrders);
            } else {
                showToast(res.message || "Failed to load orders", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error loading orders", "error");
        }
    },

    async loadStatusList() {
        try {
            const res = await OrderService.getStatusList();
            if (res.success) {
                this.statusList = res.data || [];
                this.populateStatusFilter();
            }
        } catch (e) {
            console.error(e);
        }
    },

    populateStatusFilter() {
        const filterEl = document.getElementById('statusFilter');
        if (!filterEl) return;
        filterEl.innerHTML = '<option value="">All Status</option>';
        this.statusList.forEach(status => {
            filterEl.innerHTML += `<option value="${status}">${status}</option>`;
        });
    },

    setupFilters() {
        const searchIdInput = document.getElementById('orderSearchId');
        const searchUsernameInput = document.getElementById('orderSearchUsername');
        const dateFilter = document.getElementById('dateFilter');
        const statusFilter = document.getElementById('statusFilter');

        const applyFilters = () => this.applyFilters();

        if (searchIdInput) searchIdInput.addEventListener('input', applyFilters);
        if (searchUsernameInput) searchUsernameInput.addEventListener('input', applyFilters);
        if (dateFilter) dateFilter.addEventListener('change', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    },

    applyFilters() {
        const searchId = (document.getElementById('orderSearchId')?.value || '').trim().toLowerCase();
        const searchUsername = (document.getElementById('orderSearchUsername')?.value || '').trim().toLowerCase();
        const dateFilterValue = document.getElementById('dateFilter')?.value || '';
        const statusFilterValue = document.getElementById('statusFilter')?.value || '';

        let filtered = this.allOrders;

        // Filter by Order ID
        if (searchId) {
            filtered = filtered.filter(o => String(o.orderId).toLowerCase().includes(searchId));
        }

        // Filter by Username
        if (searchUsername) {
            filtered = filtered.filter(o => (o.username || '').toLowerCase().includes(searchUsername));
        }

        // Filter by Date
        if (dateFilterValue) {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let startDate;

            switch (dateFilterValue) {
                case 'today':
                    startDate = startOfToday;
                    break;
                case 'yesterday':
                    startDate = new Date(startOfToday);
                    startDate.setDate(startDate.getDate() - 1);
                    break;
                case 'week':
                    startDate = new Date(startOfToday);
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(startOfToday);
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
            }

            if (startDate) {
                filtered = filtered.filter(o => {
                    const orderDate = new Date(o.createdAt);
                    if (dateFilterValue === 'yesterday') {
                        return orderDate >= startDate && orderDate < startOfToday;
                    }
                    return orderDate >= startDate;
                });
            }
        }

        // Filter by Status
        if (statusFilterValue) {
            filtered = filtered.filter(o => o.status === statusFilterValue);
        }

        this.renderOrders(filtered);
    },

    renderOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No orders found.</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const statusStyle = OrderUI.getStatusStyle(order.status);
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            }) : 'N/A';

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-4 font-medium text-slate-800">#${order.orderId}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                ${(order.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span class="font-medium text-slate-700">${order.username || 'N/A'}</span>
                        </div>
                    </td>
                    <td class="p-4 text-slate-600">${date}</td>
                    <td class="p-4 font-bold text-slate-800">Rs. ${(order.totalAmount || 0).toFixed(2)}</td>
                    <td class="p-4">
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${statusStyle.badgeBg} ${statusStyle.badgeText}">${order.status}</span>
                    </td>
                    <td class="p-4">
                        <button onclick="OrderManager.viewOrderDetails(${order.orderId})" 
                            class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold hover:underline">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async viewOrderDetails(orderId) {
        showToast("Fetching order details...");
        this.currentOrderId = orderId;

        try {
            const res = await OrderService.getOrderDetails(orderId);
            if (res.success) {
                this.populateOrderDetailModal(res.data);
            } else {
                showToast(res.message || "Failed to load order details", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error loading order details", "error");
        }
    },

    populateOrderDetailModal(order) {
        const statusInfo = OrderUI.getStatusStyle(order.status);

        // Order ID
        const popupOrderId = document.getElementById('popupOrderId');
        if (popupOrderId) popupOrderId.textContent = order.orderId;

        // Status
        const statusText = document.getElementById('popupStatus');
        const statusBg = document.getElementById('popupStatusBg');
        if (statusText && statusBg) {
            statusText.textContent = order.status;
            statusText.className = `font-bold ${statusInfo.textClass} capitalize`;
            statusBg.className = `p-3 rounded-full ${statusInfo.bgClass} ${statusInfo.textClass}`;
        }

        // Date
        let dateStr = 'N/A';
        if (order.createdAt) {
            dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        const popupDate = document.getElementById('popupDate');
        if (popupDate) popupDate.textContent = dateStr;

        // Payment
        const paymentMethodEl = document.getElementById('popupPaymentMethod');
        const paymentStatusEl = document.getElementById('popupPaymentStatus');
        if (paymentMethodEl) {
            if (order.payment) {
                paymentMethodEl.textContent = (order.payment.paymentMethod || 'N/A').replace(/_/g, ' ');
                if (paymentStatusEl) {
                    paymentStatusEl.textContent = `Status: ${order.payment.paymentStatus || 'N/A'}`;
                    if (order.payment.transactionId) {
                        paymentStatusEl.textContent += ` | Ref: ${order.payment.transactionId}`;
                    }
                }
            } else {
                paymentMethodEl.textContent = 'Cash on Delivery';
                if (paymentStatusEl) paymentStatusEl.textContent = 'Status: Pending';
            }
        }

        // Total
        const popupTotal = document.getElementById('popupTotal');
        if (popupTotal) {
            popupTotal.textContent = `Rs. ${(order.totalAmount || 0).toFixed(2)}`;
        }

        // Address
        const address = order.address;
        const addressContainer = document.getElementById('popupAddress');
        if (addressContainer) {
            if (address) {
                addressContainer.innerHTML = `
                    <p class="font-bold text-slate-800">${address.place || ''}</p>
                    <p>${address.landmark || ''}</p>
                    <p>${address.district || ''}, ${address.province || ''}</p>
                    <p class="mt-2 flex items-center gap-2 text-indigo-600 font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        ${order.phoneNumber || 'N/A'}
                    </p>
                `;
            } else {
                addressContainer.innerHTML = '<p class="text-slate-400 italic">Address not available</p>';
            }
        }

        // Items
        const itemsContainer = document.getElementById('popupItemsContainer');
        if (itemsContainer) {
            itemsContainer.innerHTML = "";
            if (order.orderItems && order.orderItems.length > 0) {
                order.orderItems.forEach(item => {
                    const product = item.product || {};
                    const imageUrl = product.imageUrl || '../assets/svg/CutLab.svg';

                    const itemHtml = `
                        <div class="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                            <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-slate-100/50 flex-shrink-0">
                                <img src="${imageUrl}" alt="${product.title || product.name || 'Product'}" class="w-full h-full object-contain">
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-[13px] font-bold text-slate-800 truncate">${product.title || product.name || 'Unknown Product'}</p>
                                <div class="flex justify-between items-center mt-1">
                                    <p class="text-[11px] font-medium text-slate-500">Qty: ${item.quantity || 0} × Rs. ${(item.price || 0).toFixed(2)}</p>
                                    <p class="text-[13px] font-bold text-blue-600">Rs. ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
                });
            } else {
                itemsContainer.innerHTML = '<p class="text-slate-400 italic">No items found.</p>';
            }
        }

        // Populate Status Dropdown
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect) {
            statusSelect.innerHTML = this.statusList.map(s =>
                `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`
            ).join('');
        }

        // Show Modal
        OrderUI.openModal('orderDetailModal');
    },

    async updateStatus() {
        const statusSelect = document.getElementById('statusSelect');
        if (!statusSelect || !this.currentOrderId) return;

        const newStatus = statusSelect.value;
        showToast("Updating status...", "info");

        try {
            const res = await OrderService.updateOrderStatus(this.currentOrderId, newStatus);
            if (res.success) {
                showToast(res.message || "Status updated successfully", "success");
                OrderUI.closeModal('orderDetailModal');
                await this.loadOrders();
                this.applyFilters();
            } else {
                showToast(res.message || "Failed to update status", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error updating status", "error");
        }
    }
};
