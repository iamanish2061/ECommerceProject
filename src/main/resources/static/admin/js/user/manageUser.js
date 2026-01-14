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

const UserManager = {
    state: {
        users: []
    },

    async init() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.handleLogout);
        await this.loadUsers();
        this.setupEventListeners();
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

    async loadUsers() {
        try {
            const res = await UserService.getAllUsers();
            if (res.success) {
                this.state.users = res.data;
                this.renderUserTable();
            } else {
                showToast(res.message || "Failed to load users", "error");
            }
        } catch (error) {
            console.error("Failed to load users", error);
            showToast("Failed to load users", "error");
        }
    },

    renderUserTable() {
        const tbody = document.getElementById('usersTableBody');
        const idFilter = document.getElementById('userSearchId').value.toLowerCase().trim();
        const nameFilter = document.getElementById('userSearchName').value.toLowerCase().trim();
        const roleFilter = document.getElementById('roleFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const filteredUsers = this.state.users.filter(u => {
            const matchesId = !idFilter || u.userId.toString().includes(idFilter);
            const matchesName = !nameFilter || (u.username && u.username.toLowerCase().includes(nameFilter)); // Search by username as per UI, or fullName if available
            const matchesRole = !roleFilter || u.role === roleFilter;
            const matchesStatus = !statusFilter || u.status === statusFilter;

            return matchesId && matchesName && matchesRole && matchesStatus;
        });

        if (filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredUsers.map(u => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${u.profileUrl || 'https://ui-avatars.com/api/?name=' + u.username}" class="w-10 h-10 rounded-full object-cover bg-slate-200" alt="${u.username}">
                        <div>
                            <div class="text-sm font-semibold text-slate-700">${u.fullName || 'N/A'}</div>
                            <div class="text-xs text-slate-400">@${u.username}</div>
                            <div class="text-[10px] text-slate-400">ID: ${u.userId}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold 
                        ${u.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' :
                u.role === 'ROLE_DRIVER' ? 'bg-orange-100 text-orange-700' :
                    u.role === 'ROLE_STAFF' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'}">
                        ${u.role.replace('ROLE_', '')}
                    </span>
                </td>
                <td class="p-4">
                     <span class="px-2 py-1 rounded-full text-xs font-bold 
                        ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                u.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'}">
                        ${u.status}
                    </span>
                </td>
                 <td class="p-4 text-sm text-slate-600">
                    ${u.email}
                </td>
                <td class="p-4 text-left">
                    <a href="manage-specific-user.html?id=${u.userId}" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold hover:underline">View</a>
                </td>
            </tr>
        `).join('');
    },

    setupEventListeners() {
        document.getElementById('userSearchId').addEventListener('input', () => this.renderUserTable());
        document.getElementById('userSearchName').addEventListener('input', () => this.renderUserTable());
        document.getElementById('roleFilter').addEventListener('change', () => this.renderUserTable());
        document.getElementById('statusFilter').addEventListener('change', () => this.renderUserTable());
    }
};
