const AppointmentUI = {
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
                return {
                    bgClass: 'bg-emerald-50',
                    textClass: 'text-emerald-600',
                    badgeBg: 'bg-emerald-100',
                    badgeText: 'text-emerald-700',
                    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                };
            case 'CANCELLED':
                return {
                    bgClass: 'bg-red-50',
                    textClass: 'text-red-600',
                    badgeBg: 'bg-red-100',
                    badgeText: 'text-red-700',
                    icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                };
            case 'NO_SHOW':
                return {
                    bgClass: 'bg-slate-50',
                    textClass: 'text-slate-600',
                    badgeBg: 'bg-slate-200',
                    badgeText: 'text-slate-700',
                    icon: 'M15.145 15.891L7.854 7.009M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                };
            case 'BOOKED':
                return {
                    bgClass: 'bg-indigo-50',
                    textClass: 'text-indigo-600',
                    badgeBg: 'bg-indigo-100',
                    badgeText: 'text-indigo-700',
                    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                };
            case 'PENDING':
                return {
                    bgClass: 'bg-yellow-50',
                    textClass: 'text-yellow-600',
                    badgeBg: 'bg-yellow-100',
                    badgeText: 'text-yellow-700',
                    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
                };
            default:
                return {
                    bgClass: 'bg-slate-50',
                    textClass: 'text-slate-600',
                    badgeBg: 'bg-slate-100',
                    badgeText: 'text-slate-700',
                    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
                };
        }
    }
};

const AppointmentManager = {
    allAppointments: [],
    currentAptId: null,

    async init() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.handleLogout);

        await this.loadAppointments();
        this.setupFilters();
    },

    async handleLogout() {
        if (!confirm('Are you sure you want to logout?')) return;
        try {
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
                const response = await AuthService.logout();
                if (response?.success) {
                    showToast('Logged out successfully', 'success');
                    setTimeout(() => window.location.href = '/auth/login.html', 500);
                } else {
                    showToast('Failed to log out', 'error');
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    async loadAppointments() {
        try {
            const res = await ManageAppointmentService.getAllAppointments();
            if (res.success) {
                this.allAppointments = res.data || [];
                this.renderAppointments(this.allAppointments);
            } else {
                showToast(res.message || "Failed to load appointments", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error loading appointments", "error");
        }
    },

    setupFilters() {
        const filters = [
            'appointmentSearchId',
            'appointmentSearchUsername',
            'appointmentSearchService',
            'dateFilter',
            'statusFilter'
        ];

        filters.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const event = el.tagName === 'SELECT' ? 'change' : 'input';
                el.addEventListener(event, () => this.applyFilters());
            }
        });
    },

    applyFilters() {
        const searchId = (document.getElementById('appointmentSearchId')?.value || '').trim().toLowerCase();
        const searchUsername = (document.getElementById('appointmentSearchUsername')?.value || '').trim().toLowerCase();
        const searchService = (document.getElementById('appointmentSearchService')?.value || '').trim().toLowerCase();
        const dateFilter = document.getElementById('dateFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        let filtered = this.allAppointments;

        if (searchId) {
            filtered = filtered.filter(a => String(a.appointmentId).includes(searchId));
        }

        if (searchUsername) {
            filtered = filtered.filter(a => (a.username || '').toLowerCase().includes(searchUsername));
        }

        if (searchService) {
            filtered = filtered.filter(a => (a.response?.name || '').toLowerCase().includes(searchService));
        }

        if (statusFilter) {
            filtered = filtered.filter(a => a.status === statusFilter);
        }

        if (dateFilter) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(a => {
                const aptDate = new Date(a.appointmentDate);
                const aptDay = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());

                switch (dateFilter) {
                    case 'today':
                        return aptDay.getTime() === today.getTime();
                    case 'tomorrow':
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        return aptDay.getTime() === tomorrow.getTime();
                    case 'yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        return aptDay.getTime() === yesterday.getTime();
                    case 'comingWeek':
                        const nextWeek = new Date(today);
                        nextWeek.setDate(today.getDate() + 7);
                        return aptDay >= today && aptDay < nextWeek;
                    case 'comingMonth':
                        const nextMonth = new Date(today);
                        nextMonth.setMonth(today.getMonth() + 1);
                        return aptDay >= today && aptDay < nextMonth;
                    case 'lastWeek':
                        const lastWeek = new Date(today);
                        lastWeek.setDate(today.getDate() - 7);
                        return aptDay < today && aptDay >= lastWeek;
                    default:
                        return true;
                }
            });
        }

        this.renderAppointments(filtered);
    },

    renderAppointments(appointments) {
        const tbody = document.getElementById('appointmentsTableBody');
        if (!tbody) return;

        if (!appointments || appointments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No appointments found.</td></tr>`;
            return;
        }

        tbody.innerHTML = appointments.map(apt => {
            const statusStyle = AppointmentUI.getStatusStyle(apt.status);
            const date = apt.appointmentDate || 'N/A';
            const time = `${apt.startTime || ''} - ${apt.endTime || ''}`;

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-4 font-bold text-slate-800 text-sm">#${apt.appointmentId}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                ${(apt.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span class="font-medium text-slate-700 text-sm truncate max-w-[120px]">${apt.username || 'N/A'}</span>
                        </div>
                    </td>
                    <td class="p-4">
                        <span class="text-sm font-semibold text-slate-700">${apt.response?.name || 'Service'}</span>
                    </td>
                    <td class="p-4 text-sm text-slate-600">${date}</td>
                    <td class="p-4 text-sm text-slate-600 font-medium">${time}</td>
                    <td class="p-4 font-black text-slate-800 text-sm">Rs. ${(apt.totalAmount || 0).toFixed(2)}</td>
                    <td class="p-4 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${statusStyle.badgeBg} ${statusStyle.badgeText}">${apt.status}</span>
                    </td>
                    <td class="p-4">
                        <button onclick="AppointmentManager.viewDetails(${apt.appointmentId})" 
                            class="text-indigo-600 hover:text-indigo-800 text-sm font-bold hover:underline">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async viewDetails(id) {
        showToast("Loading details...");
        this.currentAptId = id;

        try {
            const res = await ManageAppointmentService.getAppointmentDetail(id);
            if (res.success) {
                this.populateModal(res.data);
                AppointmentUI.openModal('appointmentDetailModal');
            } else {
                showToast(res.message || "Failed to load details", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error loading details", "error");
        }
    },

    populateModal(apt) {
        const style = AppointmentUI.getStatusStyle(apt.status);

        // Header
        document.getElementById('popupAptId').textContent = apt.appointmentId;
        const statusText = document.getElementById('popupStatus');
        const statusBg = document.getElementById('popupStatusBg');
        statusText.textContent = apt.status;
        statusText.className = `text-base font-bold capitalize leading-none ${style.textClass}`;
        statusBg.className = `p-2.5 rounded-xl ${style.bgClass} ${style.textClass}`;
        statusBg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="${style.icon}" /></svg>`;

        // Customer
        document.getElementById('popupCustName').textContent = apt.userResponse?.fullName || 'N/A';
        document.getElementById('popupCustEmail').textContent = apt.userResponse?.email || 'N/A';
        document.getElementById('custAvatar').textContent = (apt.userResponse?.fullName || 'U').charAt(0).toUpperCase();

        // Staff
        document.getElementById('popupStaffName').textContent = apt.staffResponse?.staffName || 'N/A';
        const staffImg = document.getElementById('staffImg');
        const staffInitial = document.getElementById('staffInitial');
        if (apt.staffResponse?.profileUrl) {
            staffImg.src = apt.staffResponse.profileUrl;
            staffImg.classList.remove('hidden');
            staffInitial.classList.add('hidden');
        } else {
            staffImg.classList.add('hidden');
            staffInitial.classList.remove('hidden');
            staffInitial.textContent = (apt.staffResponse?.staffName || 'S').charAt(0).toUpperCase();
        }

        // Service
        document.getElementById('popupSvcName').textContent = apt.serviceResponse?.name || 'N/A';
        document.getElementById('popupSvcDuration').textContent = `Duration: ${apt.serviceResponse?.durationMinutes || '...'} mins`;
        document.getElementById('popupSvcPrice').textContent = `Rs. ${(apt.totalAmount || 0).toFixed(2)}`;
        if (apt.serviceResponse?.imageUrl) {
            document.getElementById('svcImg').src = apt.serviceResponse.imageUrl;
        }

        // Schedule
        document.getElementById('popupAptDate').textContent = apt.appointmentDate || 'N/A';
        document.getElementById('popupAptTime').textContent = `${apt.startTime || ''} - ${apt.endTime || ''}`;

        // Notes
        document.getElementById('popupNotes').textContent = apt.specialNotes || 'No special notes provided';

        // Payment
        const payStatus = document.getElementById('payStatus');
        const payMethod = document.getElementById('payMethod');
        const payTrans = document.getElementById('payTransaction');

        if (apt.paymentResponse) {
            payMethod.textContent = (apt.paymentResponse.paymentMethod || 'Online').replace(/_/g, ' ');
            payStatus.textContent = apt.paymentResponse.paymentStatus || 'PENDING';
            payTrans.textContent = `Transaction Ref: ${apt.paymentResponse.transactionId || 'N/A'}`;
        } else {
            payMethod.textContent = 'Unpaid / Manual';
            payStatus.textContent = 'PENDING';
            payTrans.textContent = 'No transaction data available';
        }

        // Status Select
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect) {
            statusSelect.value = apt.status;
        }
    },

    async updateStatus() {
        const select = document.getElementById('statusSelect');
        if (!select || !this.currentAptId) return;

        const status = select.value;
        showToast("Updating status...", "info");

        try {
            const res = await ManageAppointmentService.updateAppointmentStatus(this.currentAptId, status);
            if (res.success) {
                showToast("Status updated successfully", "success");
                AppointmentUI.closeModal('appointmentDetailModal');
                await this.loadAppointments();
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
