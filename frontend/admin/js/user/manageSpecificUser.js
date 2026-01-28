const SpecificUserUI = {
    openModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('modal-active');
        }
    },

    closeModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        }
    },

    renderInfoCard: (title, data) => {
        let content = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
        for (const [key, value] of Object.entries(data)) {
            // Check for image URLs
            if (typeof value === 'string' && (value.startsWith('http') || value.includes('/'))) {
                // Assume it might be an image if valid url or path, but safer to check key name
                if (key.toLowerCase().includes('uploads') || key.toLowerCase().includes('image') || key.toLowerCase().includes('license')) {
                    content += `
                        <div class="col-span-2">
                             <p class="text-xs font-bold uppercase text-slate-400 mb-1">${key.replace(/([A-Z])/g, ' $1').trim()}</p>
                             <img src="${value}" alt="${key}" class="max-w-xs rounded-lg border shadow-sm">
                        </div>`;
                    continue;
                }
            }

            content += `
                <div>
                    <p class="text-xs font-bold uppercase text-slate-400 mb-1">${key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p class="font-semibold text-slate-700">${value || 'N/A'}</p>
                </div>
            `;
        }
        content += `</div>`;
        return content;
    },

    renderOrderList: (orders) => {
        if (!orders || orders.length === 0) return '<p class="text-slate-500 italic">No orders found.</p>';

        return `
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 border-b">
                        <tr>
                            <th class="p-3 font-semibold text-slate-600">Order ID</th>
                            <th class="p-3 font-semibold text-slate-600">Date</th>
                            <th class="p-3 font-semibold text-slate-600">Total</th>
                            <th class="p-3 font-semibold text-slate-600">Status</th>
                            <th class="p-3 font-semibold text-slate-600">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${orders.map(o => `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3">#${o.orderId}</td>
                                <td class="p-3">${o.createdAt || 'N/A'}</td>
                                <td class="p-3 font-bold">Rs. ${o.totalAmount}</td>
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">${o.status}</span>
                                </td>
                                <td class="p-3">
                                    <button class="text-indigo-600 hover:text-indigo-800 font-medium" onclick="SpecificUserManager.showOrderDetails(${o.orderId})">View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
         `;
    },

    renderAppointmentList: (appointments) => {
        if (!appointments || appointments.length === 0) return '<p class="text-slate-500 italic">No appointments found.</p>';
        return `
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 border-b text-slate-400">
                        <tr>
                            <th class="p-3 font-bold uppercase text-[10px] tracking-wider">Service</th>
                            <th class="p-3 font-bold uppercase text-[10px] tracking-wider">Date</th>
                            <th class="p-3 font-bold uppercase text-[10px] tracking-wider">Time</th>
                            <th class="p-3 font-bold uppercase text-[10px] tracking-wider">Status</th>
                            <th class="p-3 font-bold uppercase text-[10px] tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y text-slate-700">
                        ${appointments.map(a => `
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="p-3 font-bold text-slate-800">${a.response?.name || 'N/A'}</td>
                                <td class="p-3 font-medium">${a.appointmentDate || 'N/A'}</td>
                                <td class="p-3 font-medium">${a.startTime || 'N/A'} - ${a.endTime || 'N/A'}</td>
                                <td class="p-3">
                                     <span class="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                                        ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    a.status === 'BOOKED' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-700'}">
                                     ${a.status}</span>
                                </td>
                                <td class="p-3">
                                    <button onclick="SpecificUserManager.showAppointmentDetails(${a.appointmentId})" class="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-wider">View Detail</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
         `;
    },

};

const SpecificUserManager = {
    userId: null,
    userRole: null,
    addresses: {},

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.userId = urlParams.get('id');
        this.userId = this.userId ? parseInt(this.userId) : null;

        if (!this.userId) {
            alert("User ID missing!");
            window.location.href = 'manage-user.html';
            return;
        }

        document.title = "Admin - Manage User ID: " + this.userId;
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.handleLogout);
        await this.loadUserDetails();
        this.setupForms();

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

    async loadUserDetails() {
        try {
            const res = await UserService.getUserDetails(this.userId);
            if (res.success) {
                const data = res.data;
                const user = data.user;
                this.userRole = user.role;
                this.addresses = data.addresses || {};

                this.renderUserProfile(user);
                this.renderAddress('home'); // Default view
                this.renderActionButtons(user.role);

                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('userContent').classList.remove('hidden');

            } else {
                showToast(res.message || "Failed to load user details", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error loading user details", "error");
        }
    },

    renderUserProfile(user) {
        document.getElementById('uProfilePic').src = user.profileUrl || `https://ui-avatars.com/api/?name=${user.username}`;
        document.getElementById('uFullName').innerText = user.fullName || 'N/A';
        document.getElementById('uUsername').innerText = '@' + user.username;
        document.getElementById('uRoleBadge').innerText = user.role.replace('ROLE_', '');
        document.getElementById('uStatusBadge').innerText = user.status;

        // Pre-select values in modals
        document.querySelector('#updateRoleForm select[name="role"]').value = user.role;
        document.querySelector('#updateStatusForm select[name="status"]').value = user.status;
    },

    renderAddress(type) {

        type = type.toUpperCase();
        const container = document.getElementById('addressContent');
        const homeTab = document.getElementById('homeTab');
        const workTab = document.getElementById('workTab');

        // Toggle Tabs
        if (type === 'HOME') {
            homeTab.classList.add('tab-active');
            homeTab.classList.remove('tab-inactive');
            workTab.classList.remove('tab-active');
            workTab.classList.add('tab-inactive');
        } else {
            workTab.classList.add('tab-active');
            workTab.classList.remove('tab-inactive');
            homeTab.classList.remove('tab-active');
            homeTab.classList.add('tab-inactive');
        }

        const addr = this.addresses[type];
        if (addr) {
            container.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="font-bold">Province:</span> ${addr.province}</div>
                    <div><span class="font-bold">District:</span> ${addr.district}</div>
                    <div><span class="font-bold">Place:</span> ${addr.place}</div>
                    <div><span class="font-bold">Landmark:</span> ${addr.landmark}</div>
                    <div><span class="font-bold">Latitude:</span> ${addr.latitude}</div>
                    <div><span class="font-bold">Longitude:</span> ${addr.longitude}</div>
                </div>
            `;
        } else {
            container.innerHTML = `<p class="italic text-slate-400">No ${type} address found.</p>`;
        }
    },

    switchAddressTab(type) {
        this.renderAddress(type);
    },

    renderActionButtons(role) {
        const container = document.getElementById('actionButtons');
        container.innerHTML = '';

        let buttons = [];

        if (role === 'ROLE_USER') {
            buttons.push({ label: 'Show User Orders', action: 'SpecificUserManager.showOrders()', color: 'bg-indigo-600 text-white' });
            buttons.push({ label: 'Show User Appointments', action: 'SpecificUserManager.showAppointments()', color: 'bg-indigo-600 text-white' });
            buttons.push({ label: 'Assign Staff', action: 'SpecificUserManager.openAssignStaffModal()', color: 'bg-green-600 text-white' });
        } else if (role === 'ROLE_DRIVER') {
            buttons.push({ label: 'Show Driver Info', action: 'SpecificUserManager.showDriverInfo()', color: 'bg-indigo-600 text-white' });
            buttons.push({ label: 'Assign Delivery', action: `SpecificUserUI.openModal('assignDriverModal')`, color: 'bg-green-600 text-white' });
        } else if (role === 'ROLE_STAFF') {
            this.showDynamicContent("Staff Details", "<p>Please see staff tab for info</p>");
        }

        container.innerHTML = buttons.map(b => `
            <button onclick="${b.action}" class="px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 shadow-md ${b.color}">
                ${b.label}
            </button>
        `).join('');
    },

    showDynamicContent(title, htmlBody) {
        const area = document.getElementById('dynamicContentArea');
        document.getElementById('dynamicContentTitle').innerText = title;
        document.getElementById('dynamicContentBody').innerHTML = htmlBody;
        area.classList.remove('hidden');
        area.scrollIntoView({ behavior: 'smooth' });
    },

    async showOrders() {
        showToast("Fetching User Orders...");
        try {
            const res = await UserService.getUserOrders(this.userId);
            if (res.success) {
                this.showDynamicContent('User Orders', SpecificUserUI.renderOrderList(res.data));
            } else {
                showToast(res.message, "error");
            }
        } catch (e) { showToast("Failed to fetch orders", "error"); }
    },

    async showOrderDetails(orderId) {
        showToast("Fetching Order Details...");
        try {
            const res = await UserService.getOrderDetails(orderId);
            if (res.success) {
                this.populateOrderDetailModal(res.data);
            } else {
                showToast(res.message, "error");
            }
        } catch (e) {
            showToast("Failed to fetch order details", "error");
        }
    },

    getStatusStyle(status) {
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
    },

    populateOrderDetailModal(order) {
        // Fix: Use 'this' to access the method
        const statusInfo = this.getStatusStyle(order.status);

        let date = 'N/A';
        if (order.createdAt) {
            date = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Update Status UI
        const statusText = document.getElementById('popupStatus');
        const statusBg = document.getElementById('popupStatusBg');
        document.getElementById('popupOrderId').textContent = order.orderId;
        if (statusText && statusBg) {
            statusText.textContent = order.status;
            statusText.className = `font-bold ${statusInfo.textClass} capitalize`;
            statusBg.className = `p-3 rounded-full ${statusInfo.bgClass} ${statusInfo.textClass}`;
        }

        const popupDate = document.getElementById('popupDate');
        if (popupDate) popupDate.textContent = date;

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

        const popupTotal = document.getElementById('popupTotal');
        if (popupTotal) {
            popupTotal.textContent = `Rs. ${(order.totalAmount || 0).toFixed(2).toLocaleString()}`;
        }

        // Removed Cancel Button Logic as per user request
        const modalActionContainer = document.getElementById('modalActionContainer');
        if (modalActionContainer) {
            modalActionContainer.classList.add('hidden');
        }

        // Address Info
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
                    const imageUrl = product.imageUrl || '../assets/svg/CutLab.svg'; // Fixed path for admin

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

        // Show Modal using UI helper
        SpecificUserUI.openModal('orderDetailModal');
    },

    async showAppointments() {
        showToast("Fetching User Appointments...");
        try {
            const res = await UserService.getUserAppointments(this.userId);
            if (res.success) {
                this.showDynamicContent('User Appointments', SpecificUserUI.renderAppointmentList(res.data));
            } else {
                showToast(res.message, "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to fetch appointments", "error");
        }
    },

    async showAppointmentDetails(aptId) {
        showToast("Fetching Appointment Details...");
        try {
            const res = await UserService.getAppointmentDetails(aptId);
            if (res.success) {
                this.populateAppointmentModal(res.data);
                SpecificUserUI.openModal('appointmentDetailModal');
            } else {
                showToast(res.message, "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to fetch appointment details", "error");
        }
    },


    populateAppointmentModal(apt) {
        const style = this.getStatusStyle(apt.status);

        // Header
        document.getElementById('popupAptId').textContent = apt.appointmentId;
        const statusText = document.getElementById('popupStatus');
        const statusBg = document.getElementById('popupStatusBg');
        statusText.textContent = apt.status;
        statusText.className = `text-base font-bold capitalize leading-none ${style.textClass}`;
        statusBg.className = `p-2.5 rounded-xl ${style.bgClass} ${style.textClass}`;

        // Customer
        document.getElementById('popupCustName').textContent = apt.userResponse?.fullName || apt.userResponse?.username || 'N/A';
        document.getElementById('popupCustEmail').textContent = apt.userResponse?.email || '';
        document.getElementById('custAvatar').textContent = (apt.userResponse?.fullName || apt.userResponse?.username || 'U').charAt(0).toUpperCase();

        // Staff
        document.getElementById('popupStaffName').textContent = apt.staffResponse?.name || 'Any Specialist';
        const staffRole = document.getElementById('popupStaffRole');
        if (staffRole) staffRole.textContent = apt.staffResponse?.expertiseIn || 'Expert Stylist';
        const staffImg = document.getElementById('staffImg');
        const staffInitial = document.getElementById('staffInitial');
        if (apt.staffResponse?.profileUrl) {
            staffImg.src = apt.staffResponse.profileUrl;
            staffImg.classList.remove('hidden');
            staffInitial.classList.add('hidden');
        } else {
            staffImg.classList.add('hidden');
            staffInitial.classList.remove('hidden');
            staffInitial.textContent = (apt.staffResponse?.name || 'S').charAt(0).toUpperCase();
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
        const payAmount = document.getElementById('payAmount');
        const payTrans = document.getElementById('payTransaction');

        if (apt.paymentResponse) {
            payMethod.textContent = (apt.paymentResponse.paymentMethod || 'Online').replace(/_/g, ' ');
            payStatus.textContent = apt.paymentResponse.paymentStatus || 'PENDING';
            payAmount.textContent = `Rs. ${(apt.paymentResponse.totalAmount || 0).toFixed(2)}`;
            payTrans.textContent = `Transaction Ref: ${apt.paymentResponse.transactionId || 'N/A'}`;
        } else {
            payMethod.textContent = 'Unpaid / Manual';
            payStatus.textContent = 'PENDING';
            payAmount.textContent = 'Rs. 0.00';
            payTrans.textContent = 'No transaction data available';
        }

        // Status Select
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect) {
            statusSelect.value = apt.status;
        }
    },

    async showDriverInfo() {
        showToast("Fetching Driver Info...");
        try {
            const res = await UserService.getDriverInfo(this.userId);
            if (res.success) {
                this.showDynamicContent('Driver Information', SpecificUserUI.renderInfoCard('Driver Profile', res.data));
            } else {
                showToast(res.message, "error");
            }
        } catch (e) { showToast("Failed to fetch driver info", "error"); }
    },

    async openAssignStaffModal() {
        showToast("Loading and expertise and services...");
        try {
            const [roleRes, serviceRes] = await Promise.all([
                UserService.getExpertFieldList(),
                UserService.getIdAndNameOfServices()
            ]);

            if (!roleRes.success || !serviceRes.success) {
                showToast("Failed to load required data", "error");
                return;
            }

            const expertiseSelect = document.querySelector('#assignStaffForm select[name="expertiseIn"]');
            const servicesChecklist = document.getElementById('servicesChecklist');

            // Populate Expertise
            expertiseSelect.innerHTML = '<option value="" disabled selected>Select expertise...</option>' +
                roleRes.data.map(role => `<option value="${role}">${role}</option>`).join('');

            // Populate Services
            servicesChecklist.innerHTML = serviceRes.data.map(s => `
                <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all">
                    <input type="checkbox" name="serviceIds" value="${s.id}" class="w-4 h-4 text-indigo-600 rounded">
                    <span class="text-sm font-medium text-slate-700">${s.name}</span>
                </label>
            `).join('');

            document.querySelector('#assignStaffForm input[name="userId"]').value = this.userId;
            SpecificUserUI.openModal('assignStaffModal');

        } catch (e) {
            console.error(e);
            showToast("Error preparing assignment form", "error");
        }
    },

    setupForms() {
        document.getElementById('updateRoleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showToast("Updating role...", "info");
            const role = e.target.role.value;
            const res = await UserService.updateUserRole(this.userId, role);
            if (res.success) {
                showToast("Role updated successfully", "success");
                SpecificUserUI.closeModal('updateRoleModal');
                this.loadUserDetails(); // Reload to refresh UI
            } else {
                showToast(res.message, "error");
            }
        });

        document.getElementById('updateStatusForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showToast("Updating status...", "info");
            const status = e.target.status.value;
            const res = await UserService.updateUserStatus(this.userId, status);
            if (res.success) {
                showToast("Status updated successfully", "success");
                SpecificUserUI.closeModal('updateStatusModal');
                this.loadUserDetails();
            } else {
                showToast(res.message, "error");
            }
        });

        document.getElementById('confirmAssignBtn').addEventListener('click', async () => {
            showToast("Assigning delivery...", "info");
            const res = await UserService.assignDriver(this.userId);
            if (res.success) {
                showToast(res.message || "Delivery assigned successfully", "success");
                SpecificUserUI.closeModal('assignDriverModal');
            } else {
                showToast(res.message || "Failed to assign delivery", "error");
            }
        });

        document.getElementById('assignStaffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showToast("Assigning staff role...", "info");
            const formData = new FormData(e.target);
            const serviceIds = Array.from(formData.getAll('serviceIds')).map(id => parseInt(id));

            const payload = {
                userId: parseInt(formData.get('userId')),
                expertiseIn: formData.get('expertiseIn'),
                serviceIds: serviceIds
            };

            try {
                const res = await UserService.assignUserAsStaff(payload);
                if (res.success) {
                    showToast("User assigned as staff successfully", "success");
                    SpecificUserUI.closeModal('assignStaffModal');
                    this.loadUserDetails(); // Reload to reflect role change
                } else {
                    showToast(res.message, "error");
                }
            } catch (error) {
                showToast("Failed to assign staff role", "error");
            }
        });
    }

};
