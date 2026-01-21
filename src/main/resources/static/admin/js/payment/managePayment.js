const PaymentUI = {
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
            case 'COMPLETED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'REFUNDED':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    }
};

const PaymentManager = {
    allPayments: [],
    currentPayId: null,
    statusList: [],

    async init() {
        document.getElementById('logoutBtn')?.addEventListener('click', this.handleLogout);
        await Promise.all([
            this.loadPayments(),
            this.loadStatusList()
        ]);
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
                    }, 200);
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

    async loadPayments() {
        showToast("Loading payments...", "info");
        try {
            const res = await ManagePaymentService.getAllPayments();
            if (res.success) {
                this.allPayments = res.data || [];
                this.renderPayments(this.allPayments);
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to load payments", "error");
        }
    },

    async loadStatusList() {
        try {
            const res = await ManagePaymentService.getAllPaymentStatus();
            if (res.success) {
                this.statusList = res.data || [];
                this.populateStatusFilter();
            }
        } catch (e) { console.error(e); }
    },

    populateStatusFilter() {
        const filter = document.getElementById('statusFilter');
        if (!filter) return;
        this.statusList.forEach(s => {
            filter.innerHTML += `<option value="${s}">${s}</option>`;
        });
    },

    setupFilters() {
        const elIds = ['paymentSearchId', 'paymentSearchUser', 'statusFilter', 'dateFilter'];
        elIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => this.applyFilters());
        });
    },

    applyFilters() {
        const searchId = document.getElementById('paymentSearchId')?.value.toLowerCase().trim();
        const searchUser = document.getElementById('paymentSearchUser')?.value.toLowerCase().trim();
        const status = document.getElementById('statusFilter')?.value;
        const dateRange = document.getElementById('dateFilter')?.value;

        let filtered = this.allPayments;

        if (searchId) {
            filtered = filtered.filter(p =>
                String(p.response?.paymentId).includes(searchId) ||
                (p.response?.transactionId || '').toLowerCase().includes(searchId)
            );
        }

        if (searchUser) {
            filtered = filtered.filter(p => (p.username || p.userResponse?.username || '').toLowerCase().includes(searchUser));
        }

        if (status) {
            filtered = filtered.filter(p => p.response?.paymentStatus === status);
        }

        if (dateRange) {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            filtered = filtered.filter(p => {
                const pDate = new Date(p.response?.paymentDate).getTime();
                switch (dateRange) {
                    case 'today': return pDate >= todayStart;
                    case 'yesterday': return pDate >= (todayStart - 86400000) && pDate < todayStart;
                    case 'week': return pDate >= (todayStart - 7 * 86400000);
                    case 'month': return pDate >= (todayStart - 30 * 86400000);
                    default: return true;
                }
            });
        }

        this.renderPayments(filtered);
    },

    renderPayments(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) return;

        if (!payments.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No transactions found.</td></tr>`;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const res = p.response || {};
            const statusClass = PaymentUI.getStatusStyle(res.paymentStatus);

            // Relation identification logic
            let relationHtml = '';
            const orderId = p.orderId || p.orderResponse?.orderId;
            const aptId = p.appointmentId || p.appointmentResponse?.appointmentId;

            if (orderId) {
                relationHtml = `<span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">ORDER #${orderId}</span>`;
            } else if (p.orderResponse) {
                relationHtml = `<span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">IN-STORE</span>`;
            } else if (aptId) {
                relationHtml = `<span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">APT #${aptId}</span>`;
            } else {
                relationHtml = `<span class="text-slate-300 text-[10px]">--</span>`;
            }

            const dateStr = res.paymentDate ? new Date(res.paymentDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            }) : 'N/A';

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-4 font-bold text-slate-800 text-sm">#${res.paymentId}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">${(p.username || p.userResponse?.username || 'U').charAt(0).toUpperCase()}</div>
                            <span class="text-sm font-semibold text-slate-700">${p.username || p.userResponse?.username || 'N/A'}</span>
                        </div>
                    </td>
                    <td class="p-4 text-center">${relationHtml}</td>
                    <td class="p-4 font-black text-slate-900 text-sm">Rs. ${(res.totalAmount || 0).toFixed(2)}</td>
                    <td class="p-4 text-center text-xs font-bold text-slate-500">${(res.paymentMethod || 'OTHER').replace(/_/g, ' ')}</td>
                    <td class="p-4 text-xs text-slate-500 font-medium">${dateStr}</td>
                    <td class="p-4 text-center">
                        <span class="px-2 py-1 rounded-full text-[9px] font-black tracking-widest border ${statusClass}">${res.paymentStatus}</span>
                    </td>
                    <td class="p-4">
                        <button onclick="PaymentManager.viewDetail(${res.paymentId})" class="text-indigo-600 hover:text-indigo-900 text-sm font-bold">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async viewDetail(id) {
        showToast("Loading detail...");
        this.currentPayId = id;
        try {
            const res = await ManagePaymentService.getPaymentDetail(id);
            if (res.success) {
                this.populateModal(res.data);
                PaymentUI.openModal('paymentDetailModal');
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to load details", "error");
        }
    },

    populateModal(data) {
        const pay = data.response || {};
        const user = data.userResponse || {};

        document.getElementById('popupPayId').textContent = pay.paymentId;
        document.getElementById('popupAmount').textContent = `Rs. ${(pay.totalAmount || 0).toFixed(2)}`;
        document.getElementById('popupMethod').textContent = (pay.paymentMethod || 'N/A').replace(/_/g, ' ');
        document.getElementById('popupTransId').textContent = pay.transactionId || 'N/A';
        const dateStr = pay.paymentDate ? new Date(pay.paymentDate).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'N/A';
        document.getElementById('popupDateHeader').textContent = dateStr;

        const statusEl = document.getElementById('popupStatus');
        statusEl.textContent = pay.paymentStatus;
        statusEl.className = `text-sm font-bold uppercase tracking-widest ${pay.paymentStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-600'}`;

        const displayName = user.fullName || user.username || 'N/A';
        document.getElementById('popupUserName').textContent = displayName;
        document.getElementById('popupUserEmail').textContent = user.email || '';
        document.getElementById('userInit').textContent = displayName.charAt(0).toUpperCase();

        const relationId = document.getElementById('relationId');
        const relStatus = document.getElementById('relationStatus');
        if (data.orderResponse) {
            const orderIdVal = data.orderResponse.orderId;
            relationId.textContent = orderIdVal ? `Order #${orderIdVal}` : 'In-Store Order';
            relationId.className = orderIdVal ? 'text-sm font-bold text-blue-600' : 'text-sm font-bold text-emerald-600';
            relStatus.textContent = data.orderResponse.status || 'N/A';
            relStatus.classList.remove('hidden');
        } else if (data.appointmentResponse) {
            relationId.textContent = `Appointment #${data.appointmentResponse.appointmentId}`;
            relationId.className = 'text-sm font-bold text-indigo-600';
            relStatus.textContent = data.appointmentResponse.status || 'N/A';
            relStatus.classList.remove('hidden');
        } else {
            relationId.textContent = 'None';
            relationId.className = 'text-sm font-bold text-slate-400';
            relStatus.classList.add('hidden');
        }

        const select = document.getElementById('statusSelect');
        select.innerHTML = this.statusList.map(s => `<option value="${s}" ${s === pay.paymentStatus ? 'selected' : ''}>${s}</option>`).join('');
    },

    async updateStatus() {
        const status = document.getElementById('statusSelect').value;
        if (!this.currentPayId) return;

        showToast("Updating...", "info");
        try {
            const res = await ManagePaymentService.updatePaymentStatus(this.currentPayId, status);
            if (res.success) {
                showToast("Status updated", "success");
                PaymentUI.closeModal('paymentDetailModal');
                this.loadPayments();
            }
        } catch (e) {
            console.error(e);
            showToast("Update failed", "error");
        }
    }
};
