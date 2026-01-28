// State management for the dashboard
let state = {
    totalUsers: 0,
    totalProducts: 0,
    totalServices: 0,
    totalOrders: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalReviews: 0,
    totalSales: 0,
    latestOrders: [],
    latestAppointments: [],
    leaveForms: [],
    registrationForms: []
};

document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    await loadDashboardData();
});

// Initializes sidebar toggle functionality.
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mainContent = document.getElementById('mainContent');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!sidebar || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('w-64');
        sidebar.classList.toggle('w-20');

        // Toggle Icons
        const closeIcon = document.getElementById('sidebarCloseIcon');
        const openIcon = document.getElementById('sidebarOpenIcon');
        if (sidebar.classList.contains('w-20')) {
            closeIcon?.classList.add('hidden');
            openIcon?.classList.remove('hidden');
        } else {
            closeIcon?.classList.remove('hidden');
            openIcon?.classList.add('hidden');
        }

        // Handle text visibility
        const labels = sidebar.querySelectorAll('.nav-label');
        labels.forEach(label => {
            label.classList.toggle('hidden');
        });
    });

    logoutBtn?.addEventListener('click', handleLogout);

    async function handleLogout() {
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
    }

}

// Loads data from indexService and renders it.
async function loadDashboardData() {
    try {
        showToast('Loading dashboard data...', 'info');
        const [dashboardResponse, orderResponse, appointmentResponse, leaveResponse, registrationResponse] = await Promise.all([
            indexService.getDashboardStats(),
            indexService.getOrders(),
            indexService.getAppointments(),
            indexService.getLeaveForms(),
            indexService.getDriverRegistrationForms()
        ]);
        if (!dashboardResponse || !dashboardResponse.success) {
            showToast('Failed to load dashboard stats', 'error');
            return;
        }
        const data = dashboardResponse.data;
        state.totalUsers = data.totalUsers;
        state.totalProducts = data.totalProducts;
        state.totalServices = data.totalServices;
        state.totalOrders = data.totalOrders;
        state.totalAppointments = data.totalAppointments;
        state.totalPayments = data.totalPayments;
        state.totalReviews = data.totalReviews;
        state.totalSales = data.totalSales;

        if (!orderResponse || !orderResponse.success) {
            showToast('Failed to load orders', 'error');
            return;
        }
        state.latestOrders = orderResponse.data || [];

        if (!appointmentResponse || !appointmentResponse.success) {
            showToast('Failed to load appointments', 'error');
            return;
        }
        state.latestAppointments = appointmentResponse.data || [];

        if (!leaveResponse || !leaveResponse.success) {
            showToast('Failed to load leave forms', 'error');
            return;
        }
        state.leaveForms = leaveResponse.data || [];

        if (!registrationResponse || !registrationResponse.success) {
            showToast('Failed to load registration forms', 'error');
            return;
        }
        state.registrationForms = registrationResponse.data || [];

        renderLatestAppointments();
        renderLatestOrders();
        renderLeaveForms();
        renderRegistrationForms();
        renderStats();
        initFormEventListeners();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showToast('An error occurred while loading dashboard data', 'error');
    }
}

/**
 * Renders statistics cards.
 * @param {Object} stats 
 */
function renderStats() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const cards = [
        { label: 'Total Users', value: state.totalUsers, icon: 'users', color: 'blue' },
        { label: 'Total Products', value: state.totalProducts, icon: 'package', color: 'indigo' },
        { label: 'Total Services', value: state.totalServices, icon: 'scissors', color: 'purple' },
        { label: 'Total Orders', value: state.totalOrders, icon: 'shopping-cart', color: 'green' },
        { label: 'Total Appointments', value: state.totalAppointments, icon: 'calendar', color: 'yellow' },
        { label: 'Total Payments', value: state.totalPayments, icon: 'banknote', color: 'emerald' },
        { label: 'Total Reviews', value: state.totalReviews, icon: 'star', color: 'orange' },
        { label: 'Total Sales', value: state.totalSales, icon: 'trending-up', color: 'rose' }
    ];

    statsContainer.innerHTML = cards.map(card => `
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div class="p-3 bg-${card.color}-100 text-${card.color}-600 rounded-xl">
                ${getIcon(card.icon)}
            </div>
            <div>
                <p class="text-sm text-slate-500 font-medium">${card.label}</p>
                <h3 class="text-2xl font-bold text-slate-800">
                    ${(card.label.includes('Payments') || card.label.includes('Sales')) ? 'Rs. ' : ''}${card.value}
                </h3>
            </div>
        </div>
    `).join('');
}

/**
 * Renders the latest orders table.
 */
function renderLatestOrders() {
    const tableBody = document.getElementById('latestOrdersTable');
    if (!tableBody) return;

    if (state.latestOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 italic">No orders for now</td></tr>`;
        return;
    }

    tableBody.innerHTML = state.latestOrders.map(order => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-4 font-medium text-slate-800">#${order.orderId}</td>
            <td class="py-4">${order.username}</td>
            <td class="py-4">Rs. ${order.totalAmount}</td>
            <td class="py-4">${order.phoneNumber}</td>
            <td class="py-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(order.status)}">
                    ${order.status}
                </span>
            </td>
        </tr>
    `).join('');
}

/**
 * Renders the latest appointments table.
 */
function renderLatestAppointments() {
    const tableBody = document.getElementById('latestAppointmentsTable');
    if (!tableBody) return;

    if (state.latestAppointments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 italic">No appointment for now</td></tr>`;
        return;
    }

    tableBody.innerHTML = state.latestAppointments.map(appointment => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-4 font-medium text-slate-800">#${appointment.appointmentId}</td>
            <td class="py-4 font-medium text-slate-800">${appointment.startTime} - ${appointment.endTime}</td>
            <td class="py-4">${appointment.username}</td>
            <td class="py-4 text-xs font-medium">${appointment.response.name}</td>
            <td class="py-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(appointment.status)}">
                    ${appointment.status}
                </span>
            </td>
        </tr>
    `).join('');
}

/**
 * Renders the leave forms table.
 */
function renderLeaveForms() {
    const tableBody = document.getElementById('leaveFormsTable');
    if (!tableBody) return;

    if (state.leaveForms.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400 italic">No leave forms for now</td></tr>`;
        return;
    }

    tableBody.innerHTML = state.leaveForms.map(form => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-4 font-medium text-slate-800">#${form.response.id}</td>
            <td class="py-4">${form.username}</td>
            <td class="py-4">${form.response.leaveDate}</td>
            <td class="py-4">${(form.response.startTime && form.response.endTime) ? `${form.response.startTime} - ${form.response.endTime}` : '<span class="text-indigo-600 font-medium">Full Day</span>'}</td>
            <td class="py-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(form.response.status)}">
                    ${form.response.status}
                </span>
            </td>
            <td class="py-4">
                <button class="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors view-leave-btn" data-staff-id="${form.staffId}" data-leave-id="${form.response.id}">
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Renders the registration forms table.
 */
function renderRegistrationForms() {
    const tableBody = document.getElementById('registrationFormsTable');
    if (!tableBody) return;

    if (state.registrationForms.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 italic">No registration forms for now</td></tr>`;
        return;
    }

    tableBody.innerHTML = state.registrationForms.map(form => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-4 font-medium text-slate-800">#${form.response.id}</td>
            <td class="py-4">${form.username}</td>
            <td class="py-4">${form.response.licenseNumber}</td>
            <td class="py-4">${form.response.vehicleNumber}</td>
            <td class="py-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(form.response.verified)}">
                    ${form.response.verified}
                </span>
            </td>
            <td class="py-4">
                <button class="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors view-registration-btn" data-user-id="${form.response.id}">
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Initializes event listeners for leave and registration forms.
 */
function initFormEventListeners() {
    // Leave form view buttons
    document.querySelectorAll('.view-leave-btn').forEach(button => {
        button.addEventListener('click', () => {
            const staffId = button.dataset.staffId;
            const leaveId = button.dataset.leaveId;
            openLeaveModal(staffId, leaveId);
        });
    });

    // Registration form view buttons
    document.querySelectorAll('.view-registration-btn').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.dataset.userId;
            openRegistrationModal(userId);
        });
    });

    // Close modals
    document.getElementById('closeLeaveModal').addEventListener('click', closeLeaveModal);
    document.getElementById('closeRegistrationModal').addEventListener('click', closeRegistrationModal);

    // Approve/Reject leave forms
    document.getElementById('approveLeaveBtn').addEventListener('click', () => handleLeaveAction('APPROVED'));
    document.getElementById('rejectLeaveBtn').addEventListener('click', () => handleLeaveAction('REJECTED'));

    // Approve/Reject registration forms
    document.getElementById('approveRegistrationBtn').addEventListener('click', () => handleRegistrationAction('VERIFIED'));
    document.getElementById('rejectRegistrationBtn').addEventListener('click', () => handleRegistrationAction('REJECTED'));
}

function openLeaveModal(staffId, leaveId) {
    const modal = document.getElementById('leaveModal');
    const content = document.getElementById('leaveModalContent');
    modal.classList.remove('hidden');
    content.innerHTML = `<p class="italic text-slate-400">Loading...</p>`;

    const form = state.leaveForms.find(f => f.staffId == staffId && f.response.id == leaveId);
    if (form) {
        modal.dataset.staffId = staffId;
        modal.dataset.leaveId = leaveId;
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Staff Member</span>
                    <span class="font-semibold text-slate-800">${form.username}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Date</span>
                    <span class="font-semibold text-slate-800">${form.response.leaveDate}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Time Range</span>
                    <span class="font-semibold text-slate-800">${(form.response.startTime && form.response.endTime) ? `${form.response.startTime} - ${form.response.endTime}` : '<span class="text-indigo-600">Full Day</span>'}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Applied on</span>
                    <span class="font-semibold text-slate-800">${form.response.createdAt}</span>
                </div>
                <div class="pt-2">
                    <p class="text-sm text-slate-500 mb-1">Reason</p>
                    <p class="text-slate-700 bg-slate-50 p-3 rounded-xl text-sm leading-relaxed">${form.response.reason || 'No reason provided'}</p>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `<p class="text-red-500">Form not found.</p>`;
    }
}

function openRegistrationModal(userId) {
    const modal = document.getElementById('registrationModal');
    const content = document.getElementById('registrationModalContent');
    modal.classList.remove('hidden');
    content.innerHTML = `<p class="italic text-slate-400">Loading...</p>`;

    const form = state.registrationForms.find(f => f.response.id == userId);
    if (form) {
        modal.dataset.userId = userId;
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Username</span>
                    <span class="font-semibold text-slate-800">${form.username}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">License Number</span>
                    <span class="font-semibold text-slate-800">${form.response.licenseNumber}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Vehicle Number</span>
                    <span class="font-semibold text-slate-800">${form.response.vehicleNumber}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-slate-500">License Expiry</span>
                    <span class="font-semibold text-slate-800">${form.response.licenseExpiry}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span class="text-sm text-slate-500">Applied on</span>
                    <span class="font-semibold text-slate-800">${form.response.submittedAt ? form.response.submittedAt.split('T')[0] : 'N/A'}</span>
                </div>
                
                <div class="pt-2">
                    <p class="text-sm text-slate-500 mb-2">License Photo</p>
                    <div class="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <img src="${form.response.licenseUrl}" alt="License Photo" 
                             class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                             onclick="window.open(this.src, '_blank')">
                    </div>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `<p class="text-red-500">Form not found.</p>`;
    }
}

function closeLeaveModal() {
    document.getElementById('leaveModal').classList.add('hidden');
}

function closeRegistrationModal() {
    document.getElementById('registrationModal').classList.add('hidden');
}

function handleLeaveAction(status) {
    const modal = document.getElementById('leaveModal');
    const staffId = modal.dataset.staffId;
    const leaveId = modal.dataset.leaveId;

    if (!staffId || !leaveId) {
        showToast('Invalid form data', 'error');
        return;
    }
    showToast(`Processing leave form...`, 'info');
    indexService.updateLeaveFormStatus(staffId, leaveId, status).then(() => {
        showToast(`Leave form ${status.toLowerCase()}`, 'success');
        closeLeaveModal();
        loadDashboardData();
    });
}

function handleRegistrationAction(status) {
    const modal = document.getElementById('registrationModal');
    const userId = modal.dataset.userId;

    if (!userId) {
        showToast('Invalid user data', 'error');
        return;
    }
    showToast(`Processing registration form...`, 'info');
    indexService.updateDriverRegistrationStatus(userId, status).then(() => {
        showToast(`Registration form ${status.toLowerCase()}`, 'success');
        closeRegistrationModal();
        loadDashboardData();
    });
}

/**
 * Helper to get status pill CSS classes.
 */
function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('confirmed') || s.includes('success')) {
        return 'bg-green-100 text-green-600';
    }
    if (s.includes('pending') || s.includes('checked-in')) {
        return 'bg-yellow-100 text-yellow-600';
    }
    if (s.includes('cancelled') || s.includes('failed')) {
        return 'bg-red-100 text-red-600';
    }
    return 'bg-slate-100 text-slate-600';
}

/**
 * Helper to get SVG icons by name.
 * @param {string} name 
 * @returns {string}
 */
function getIcon(name) {
    const icons = {
        'users': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        'package': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>`,
        'scissors': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><circle cx="6" cy="6" r="3"></circle><path d="M8.12 8.12 12 12"></path><circle cx="6" cy="18" r="3"></circle><path d="M14.8 14.8 20 20"></path><path d="M14.8 9.2 20 4"></path><path d="m8.12 15.88 3.84-3.84"></path></svg>`,
        'shopping-cart': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>`,
        'calendar': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>`,
        'banknote': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect width="20" height="12" x="2" y="6" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`,
        'star': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        'trending-up': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`
    };
    return icons[name] || '';
}
