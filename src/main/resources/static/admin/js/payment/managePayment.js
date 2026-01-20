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
        if (confirm('Are you sure?')) {
            await AuthService.logout();
            window.location.href = '/auth/login.html';
        }
    },

    async loadPayments() {
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
            filtered = filtered.filter(p => (p.username || '').toLowerCase().includes(searchUser));
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
            if (p.orderId) {
                relationHtml = `<span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">ORDER #${p.orderId}</span>`;
            } else if (p.appointmentId) {
                relationHtml = `<span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">APT #${p.appointmentId}</span>`;
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
                            <div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">${(p.username || 'U').charAt(0).toUpperCase()}</div>
                            <span class="text-sm font-semibold text-slate-700">${p.username || 'N/A'}</span>
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
        showToast("Loading...");
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

        const statusEl = document.getElementById('popupStatus');
        statusEl.textContent = pay.paymentStatus;
        statusEl.className = `text-sm font-bold uppercase tracking-widest ${pay.paymentStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-600'}`;

        document.getElementById('popupUserName').textContent = user.fullName || 'N/A';
        document.getElementById('popupUserEmail').textContent = user.email || 'N/A';
        document.getElementById('userInit').textContent = (user.fullName || 'U').charAt(0).toUpperCase();

        const relationId = document.getElementById('relationId');
        if (data.orderResponse) {
            relationId.textContent = `Order #${data.orderResponse.orderId}`;
            relationId.className = 'text-sm font-bold text-blue-600';
        } else if (data.appointmentResponse) {
            relationId.textContent = `Appointment #${data.appointmentResponse.appointmentId}`;
            relationId.className = 'text-sm font-bold text-indigo-600';
        } else {
            relationId.textContent = 'None';
            relationId.className = 'text-sm font-bold text-slate-400';
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
