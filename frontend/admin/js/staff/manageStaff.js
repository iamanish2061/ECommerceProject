const StaffManager = {
    state: {
        staff: [],
        allServices: [],
        selectedStaffId: null,
        selectedStaffData: null
    },

    init: async () => {
        // Logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', StaffManager.handleLogout);

        await StaffManager.loadAllData();
        StaffManager.setupEventListeners();
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

    loadAllData: async () => {
        showToast("Loading staff...", "info");
        try {
            const res = await ManageStaffService.getAllStaff();
            if (res.success) {
                StaffManager.state.staff = res.data;
                StaffManager.renderStaffTable();
            }
        } catch (error) {
            console.error("Load Error:", error);
            showToast("Failed to load staff list", "error");
        }
    },

    setupEventListeners: () => {
        // Search
        document.getElementById('staffSearch')?.addEventListener('input', (e) => {
            StaffManager.renderStaffTable(e.target.value);
        });
    },

    // --- Rendering ---
    renderStaffTable: (filter = "") => {
        const tbody = document.getElementById('staffTableBody');
        if (!tbody) return;

        const term = filter.toLowerCase();
        const filtered = StaffManager.state.staff.filter(s =>
            (s.fullName || '').toLowerCase().includes(term) ||
            (s.email || '').toLowerCase().includes(term) ||
            (s.expertiseIn || '').toLowerCase().includes(term) ||
            (s.username || '').toLowerCase().includes(term)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400 font-medium">No matching staff members found.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(staff => `
            <tr class="hover:bg-slate-50 transition-all group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${staff.profileUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(staff.fullName)}" class="w-10 h-10 rounded-full object-cover border border-slate-200" alt="${staff.fullName}">
                        <div>
                            <div class="text-sm font-bold text-slate-800">${staff.fullName}</div>
                            <div class="text-[12px] text-slate-400">${staff.email}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                        ${staff.expertiseIn.replace(/_/g, ' ')}
                    </span>
                </td>
                <td class="p-4 text-xs font-medium text-slate-500">
                    ${staff.joinedDate ? new Date(staff.joinedDate).toLocaleDateString() : '-'}
                </td>
                <td class="p-4 text-xs font-bold text-slate-600">
                    <div class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        ${staff.totalServices} Services
                    </div>
                </td>
                <td class="p-4">
                    <button onclick="StaffManager.handleViewClick(${staff.staffId})" 
                        class="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        Manage
                    </button>
                </td>
            </tr>
        `).join('');
    },

    handleViewClick: async (id) => {
        showToast("Loading staff details...", "info");
        try {
            StaffManager.state.selectedStaffId = id;
            const res = await ManageStaffService.getStaffDetail(id);
            if (res.success) {
                StaffManager.state.selectedStaffData = res.data;
                StaffManager.populateDetailModal(res.data);
                StaffUI.openModal('staffDetailModal');
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to fetch staff details", "error");
        }
    },

    populateDetailModal: (data) => {
        const staff = data.staffListResponse;
        // Header
        document.getElementById('modalProfileImg').src = staff.profileUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(staff.fullName);
        document.getElementById('modalStaffName').innerText = staff.fullName;
        document.getElementById('modalStaffRole').innerText = staff.expertiseIn.replace(/_/g, ' ');

        const badge = document.getElementById('modalAppointmentBadge');
        if (data.upcomingAppointmentsCount > 0) {
            badge.innerText = `${data.upcomingAppointmentsCount} Upcoming Appointments`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        // Tab: Overview
        document.getElementById('infoUsername').innerText = staff.username || '-';
        document.getElementById('infoEmail').innerText = staff.email || '-';
        document.getElementById('infoJoined').innerText = staff.joinedDate ? new Date(staff.joinedDate).toDateString() : '-';
        document.getElementById('infoTotalServices').innerText = staff.totalServices + " Active Services";
        document.getElementById('infoAppointments').innerText = data.upcomingAppointmentsCount + " Scheduled";

        // Tab: Schedule
        StaffManager.renderWorkingSchedule(data.workingHours || []);

        // Tab: Leaves
        StaffManager.renderLeaveInfo(data.leaves || []);

        // Tab: Services
        StaffManager.renderServiceExpertise(data.services || []);
    },

    // --- Tab: Working Schedule ---
    renderWorkingSchedule: (workingHours) => {
        const tbody = document.getElementById('workingDaysTable');
        const saveBtn = document.getElementById('saveWorkingHoursBtn');
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

        // Check if updating or new
        const isNew = workingHours.length === 0;
        saveBtn.innerHTML = isNew ? `
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            Save Schedule
        ` : `
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Update Schedule
        `;

        tbody.innerHTML = days.map(day => {
            // Find existing or default to Working Day (false for On Leave)
            const existing = workingHours.find(w => w.dayOfWeek === day) || { isWorkingDay: true };
            const isOnLeave = existing.isWorkingDay === false;

            return `
                <tr class="group hover:bg-slate-50/50 transition-colors day-row" data-day="${day}">
                    <td class="px-6 py-4 text-xs font-bold text-slate-700">${day}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2 text-xs font-mono text-slate-500">
                            <span class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">10:00</span>
                            <span>-</span>
                            <span class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">19:00</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center justify-center gap-3">
                            <span class="status-label text-[10px] font-bold uppercase tracking-wider ${isOnLeave ? 'text-amber-500' : 'text-emerald-500'}">
                                ${isOnLeave ? 'On Leave' : 'On Duty'}
                            </span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="day-checkbox sr-only peer" ${isOnLeave ? 'checked' : ''} 
                                    onchange="StaffManager.handleToggleDuty(this)">
                                <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    handleToggleDuty: (checkbox) => {
        const label = checkbox.closest('.flex').querySelector('.status-label');
        if (checkbox.checked) {
            label.innerText = 'On Leave';
            label.className = 'status-label text-[10px] font-bold uppercase tracking-wider text-amber-500';
        } else {
            label.innerText = 'On Duty';
            label.className = 'status-label text-[10px] font-bold uppercase tracking-wider text-emerald-500';
        }
    },

    saveSchedule: async () => {
        const staffId = StaffManager.state.selectedStaffId;
        const saveBtn = document.getElementById('saveWorkingHoursBtn');
        const rows = document.querySelectorAll('.day-row');

        const payload = Array.from(rows).map(row => ({
            dayOfWeek: row.dataset.day,
            startTime: "10:00:00",
            endTime: "19:00:00",
            isWorkingDay: !row.querySelector('.day-checkbox').checked // Checked means On Leave (isWorkingDay: false)
        }));

        const originalHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerText = "Processing...";

        try {
            const res = await ManageStaffService.setWorkingHours(staffId, payload);
            if (res.success) {
                showToast("Schedule updated successfully", "success");
                await StaffManager.reloadActiveDetail();
            } else {
                showToast(res.message || "Failed to update schedule", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error updating schedule", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
        }
    },

    // --- Tab: Leave Info ---
    renderLeaveInfo: (leaves) => {
        const upcomingContainer = document.getElementById('upcomingLeavesList');
        const historyContainer = document.getElementById('leaveHistoryList');

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcoming = leaves.filter(l => new Date(l.leaveDate) >= now)
            .sort((a, b) => new Date(a.leaveDate) - new Date(b.leaveDate));

        const history = leaves.filter(l => new Date(l.leaveDate) < now)
            .sort((a, b) => new Date(b.leaveDate) - new Date(a.leaveDate));

        const renderLeafItem = (l, isHistory) => `
            <div class="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center group shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isHistory ? 'bg-slate-50 text-slate-400' : 'bg-amber-50 text-amber-600'}">
                        <span class="text-[8px] font-bold uppercase">${new Date(l.leaveDate).toLocaleString('default', { month: 'short' })}</span>
                        <span class="text-sm font-bold leading-none">${new Date(l.leaveDate).getDate()}</span>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-slate-700">${l.reason || 'No reason provided'}</div>
                        <div class="text-[10px] text-slate-400 font-medium">
                            ${l.startTime ? `${l.startTime.substring(0, 5)} - ${l.endTime.substring(0, 5)}` : 'Full working day'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        upcomingContainer.innerHTML = upcoming.length > 0
            ? upcoming.map(l => renderLeafItem(l, false)).join('')
            : '<p class="text-[11px] text-slate-400 italic text-center py-8">No upcoming leaves scheduled.</p>';

        historyContainer.innerHTML = history.length > 0
            ? history.map(l => renderLeafItem(l, true)).join('')
            : '<p class="text-[11px] text-slate-400 italic text-center py-8">No past leave records.</p>';
    },

    // --- Tab: Services ---
    renderServiceExpertise: async (assignedServices) => {
        const currentContainer = document.getElementById('currentServicesList');
        const availableContainer = document.getElementById('availableServicesChecklist');
        const assignBtn = document.getElementById('assignServicesBtn');

        // Render Current
        if (assignedServices.length === 0) {
            currentContainer.innerHTML = '<p class="text-[11px] text-slate-400 italic text-center w-full py-12">No services assigned yet.</p>';
        } else {
            currentContainer.innerHTML = assignedServices.map(s => `
                <div class="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[11px] font-bold border border-indigo-100 flex items-center gap-2 group transition-all hover:bg-white hover:border-indigo-200 shadow-sm">
                    ${s.name}
                    <button onclick="StaffManager.removeService(${s.serviceId})" 
                        class="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors text-indigo-300">
                        &times;
                    </button>
                </div>
            `).join('');
        }

        // Fetch and Filter Available
        try {
            const res = await ManageStaffService.getServiceNameAndId();
            if (res.success) {
                const assignedIds = assignedServices.map(s => s.serviceId);
                const available = res.data.filter(s => !assignedIds.includes(s.id));

                if (available.length === 0) {
                    availableContainer.innerHTML = '<p class="text-[11px] text-slate-400 italic text-center py-12">All available services are already assigned.</p>';
                    assignBtn.classList.add('hidden');
                } else {
                    assignBtn.classList.remove('hidden');
                    availableContainer.innerHTML = available.map(s => `
                        <label class="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                            <input type="checkbox" name="serviceToAdd" value="${s.id}" 
                                class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all">
                            <div class="flex-1">
                                <p class="text-xs font-bold text-slate-700 group-hover:text-emerald-700">${s.name}</p>
                            </div>
                        </label>
                    `).join('');
                }
            }
        } catch (e) {
            console.error(e);
            availableContainer.innerHTML = '<p class="text-xs text-red-400 text-center py-8">Failed to load available services.</p>';
        }
    },

    assignSelectedServices: async () => {
        const staffId = StaffManager.state.selectedStaffId;
        const selected = Array.from(document.querySelectorAll('input[name="serviceToAdd"]:checked')).map(i => parseInt(i.value));

        if (selected.length === 0) {
            showToast("Please select at least one service", "warning");
            return;
        }

        try {
            const res = await ManageStaffService.assignServicesToStaff(staffId, selected);
            if (res.success) {
                showToast(`Assigned ${selected.length} services successfully`, "success");
                StaffManager.reloadActiveDetail();
            } else {
                showToast(res.message || "Failed to assign services", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error assigning services", "error");
        }
    },

    removeService: async (serviceId) => {
        const staffId = StaffManager.state.selectedStaffId;
        if (!confirm("Are you sure you want to remove this service expertise?")) return;

        try {
            const res = await ManageStaffService.removeServiceFromStaff(staffId, serviceId);
            if (res.success) {
                showToast("Service removed from expertise list", "success");
                StaffManager.reloadActiveDetail();
            } else {
                showToast(res.message || "Failed to remove service", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error removing service", "error");
        }
    },

    reloadActiveDetail: async () => {
        const id = StaffManager.state.selectedStaffId;
        const res = await ManageStaffService.getStaffDetail(id);
        if (res.success) {
            StaffManager.state.selectedStaffData = res.data;
            StaffManager.populateDetailModal(res.data);
            StaffManager.loadAllData(); // Sync main table counts
        }
    }
};

const StaffUI = {
    openModal: (id) => {
        const modal = document.getElementById(id);
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (id === 'staffDetailModal') StaffUI.switchTab('overview');
    },
    closeModal: (id) => {
        document.getElementById(id).classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    },
    switchTab: (tabName) => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active', 'text-indigo-600', 'border-indigo-600');
                btn.classList.remove('text-slate-500', 'border-transparent');
            } else {
                btn.classList.remove('active', 'text-indigo-600', 'border-indigo-600');
                btn.classList.add('text-slate-500', 'border-transparent');
            }
        });
    }
};

window.StaffUI = StaffUI;
window.StaffManager = StaffManager;

document.addEventListener('DOMContentLoaded', StaffManager.init);
