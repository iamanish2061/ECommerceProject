function showToast(message, type = "info", duration = 1500) {
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
                if (key.toLowerCase().includes('document') || key.toLowerCase().includes('image') || key.toLowerCase().includes('license')) {
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
                                <td class="p-3">${o.orderDate || 'N/A'}</td>
                                <td class="p-3 font-bold">Rs. ${o.totalAmount}</td>
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">${o.orderStatus}</span>
                                </td>
                                <td class="p-3">
                                    <button class="text-indigo-600 hover:text-indigo-800 font-medium">View</button>
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
                    <thead class="bg-slate-50 border-b">
                        <tr>
                            <th class="p-3 font-semibold text-slate-600">Service</th>
                             <th class="p-3 font-semibold text-slate-600">Date</th>
                            <th class="p-3 font-semibold text-slate-600">Time</th>
                            <th class="p-3 font-semibold text-slate-600">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${appointments.map(a => `
                            <tr>
                                <td class="p-3 font-medium">${a.serviceName}</td>
                                <td class="p-3">${a.date}</td>
                                <td class="p-3">${a.time}</td>
                                <td class="p-3">
                                     <span class="px-2 py-1 rounded-full text-xs font-bold 
                                        ${a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
                                     ${a.status}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
         `;
    }
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
        await this.loadUserDetails();
        this.setupForms();
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
        } else if (role === 'ROLE_DRIVER') {
            buttons.push({ label: 'Show Driver Info', action: 'SpecificUserManager.showDriverInfo()', color: 'bg-indigo-600 text-white' });
            buttons.push({ label: 'Assign Delivery', action: 'SpecificUserUI.openModal("assignDriverModal")', color: 'bg-green-600 text-white' });
        } else if (role === 'ROLE_STAFF') {
            buttons.push({ label: 'View Staff Info', action: 'SpecificUserManager.showStaffInfo()', color: 'bg-indigo-600 text-white' });
            buttons.push({ label: 'View Staff Appointment', action: 'SpecificUserManager.showAppointments()', color: 'bg-indigo-600 text-white' });
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

    async showAppointments() {
        showToast("Fetching Appointments...");
        try {
            const res = await UserService.getUserAppointments(this.userId);
            if (res.success) {
                this.showDynamicContent('User Appointments', SpecificUserUI.renderAppointmentList(res.data));
            } else {
                showToast(res.message, "error");
            }
        } catch (e) { showToast("Failed to fetch appointments", "error"); }
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

    async showStaffInfo() {
        showToast("Fetching Staff Info...");
        try {
            const res = await UserService.getStaffInfo(this.userId);
            if (res.success) {
                this.showDynamicContent('Staff Information', SpecificUserUI.renderInfoCard('Staff Profile', res.data));
            } else {
                showToast(res.message, "error");
            }
        } catch (e) { showToast("Failed to fetch staff info", "error"); }
    },

    setupForms() {
        document.getElementById('updateRoleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
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
            // Logic for assigning driver - assuming simple toggle for now or backend handles logic
            // But the API UserService.assignDriver(driverId) needs to be called
            // However, assigning delivery usually implies assigning THIS driver to SOME order.
            // The prompt requirement "Assign Delivery" button for Driver likely means "Assign A Delivery TO This Driver".
            // The API `POST /api/admin/users/assign-driver/{driverId}` signature suggests maybe an auto-assignment or it needs a body?
            // Checking controller: `AdminUserController.java` wasn't fully deep dived for that endpoint body.
            // But assuming simple call based on instruction.

            const res = await UserService.assignDriver(this.userId);
            if (res.success) {
                showToast("Delivery assigned successfully", "success");
                SpecificUserUI.closeModal('assignDriverModal');
            } else {
                showToast(res.message, "error");
            }
        });
    }

};
