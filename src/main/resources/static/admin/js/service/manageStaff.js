/**
 * manageStaff.js - Admin staff management logic
 * Refactored to match Table + Modal pattern
 */

function showToast(message, type = "info", duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

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

    handleLogout: async () => {
        if (!confirm('Logout?')) return;
        try {
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
                await AuthService.logout();
                window.location.href = '/auth/login.html';
            }
        } catch (e) { console.error(e); }
    },

    loadAllData: async () => {
        try {
            const [staffRes, servicesRes] = await Promise.all([
                ManageStaffService.getAllStaff(),
                ManageServiceService.getAllServices()
            ]);

            if (staffRes.success) {
                StaffManager.state.staff = staffRes.data;
                StaffManager.renderStaffTable();
            }

            if (servicesRes.success) {
                StaffManager.state.allServices = servicesRes.data;
                // Populate Service Select in Modal
                const select = document.getElementById('serviceSelect');
                if (select) {
                    select.innerHTML = '<option value="">Choose a service...</option>' +
                        servicesRes.data.map(s => `<option value="${s.id}">${s.name} (${s.category})</option>`).join('');
                }
            }
        } catch (error) {
            console.error("Load Error:", error);
            showToast("Failed to load data", "error");
        }
    },

    setupEventListeners: () => {
        // Search
        document.getElementById('staffSearch')?.addEventListener('input', (e) => {
            StaffManager.renderStaffTable(e.target.value);
        });

        // Assign/Create Staff
        document.getElementById('assignStaffForm')?.addEventListener('submit', StaffManager.handleAssignStaff);

        // Edit Schedule
        document.getElementById('saveScheduleBtn')?.addEventListener('click', StaffManager.handleSaveSchedule);

        // Add Leave
        document.getElementById('modalLeaveForm')?.addEventListener('submit', StaffManager.handleAddLeave);
    },

    // --- Rendering ---
    renderStaffTable: (filter = "") => {
        const tbody = document.getElementById('staffTableBody');
        if (!tbody) return;

        const term = filter.toLowerCase();
        const filtered = StaffManager.state.staff.filter(s =>
            s.fullName.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term) ||
            s.expertiseIn.toLowerCase().includes(term)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-400">No staff found.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(staff => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${staff.profileUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(staff.fullName)}" class="w-10 h-10 rounded-full object-cover border border-slate-200" alt="${staff.fullName}">
                        <div>
                            <div class="text-sm font-bold text-slate-800">${staff.fullName}</div>
                            <div class="text-xs text-slate-400">${staff.email || staff.username}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold uppercase tracking-wide">
                        ${staff.expertiseIn.replace(/_/g, ' ')}
                    </span>
                </td>
                <td class="p-4 text-sm text-slate-600">
                    ${staff.joinedDate ? new Date(staff.joinedDate).toLocaleDateString() : '-'}
                </td>
                <td class="p-4 text-sm text-slate-600 font-medium">
                    ${staff.totalServices} Assigned
                </td>
                <td class="p-4">
                    <button onclick="StaffManager.handleViewClick(${staff.staffId})" class="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm">
                        Manage
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // --- Actions ---

    handleAssignStaff: async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            userId: formData.get('userId'), // Can be ID or Email as per backend (assuming support or ID)
            expertiseIn: formData.get('expertiseIn')
        };
        // Backend expects 'userId' as Long if strictly ID, or maybe String if flexibility. 
        // Based on DTO, it expects Long userId.
        // If logic requires mapping email -> ID, backend should handle or we need another step. 
        // FOR NOW assuming User enters ID. If Email needed, backend logic needs update or frontend fetch.
        // NOTE: The previous UI asked for "ID or Email". I'll pass it as is? No, DTO says Long `userId`.
        // Let's assume input is ID for robust 'init'. 

        try {
            const res = await ManageStaffService.assignStaffRole(data);
            if (res.success) {
                showToast("Staff assigned successfully", "success");
                StaffUI.closeModal('addStaffModal');
                StaffManager.loadAllData();
            } else {
                showToast(res.message || "Failed to assign staff", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error assigning staff", "error");
        }
    },

    handleViewClick: async (id) => {
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
            showToast("Failed to fetch details", "error");
        }
    },

    populateDetailModal: (data) => {
        // Hedaer
        document.getElementById('modalProfileImg').src = data.profileUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name);
        document.getElementById('modalStaffName').innerText = data.name;
        document.getElementById('modalStaffRole').innerText = data.expertise.replace(/_/g, ' ');
        document.getElementById('modalStaffId').value = data.id;

        // 1. Overview Tab (Schedule)
        StaffManager.renderScheduleMatrix(data.workingHours);

        // 2. Services Tab
        StaffManager.renderServicesList(data.services);

        // 3. Leaves Tab
        StaffManager.renderLeavesList(data.upcomingLeaves);
    },

    // --- Sub-Components ---

    renderScheduleMatrix: (workingHours) => {
        const container = document.getElementById('modalHoursMatrix');
        container.innerHTML = '';
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

        days.forEach(day => {
            const existing = workingHours.find(w => w.dayOfWeek === day)
                || { isWorkingDay: false, startTime: '09:00', endTime: '18:00' };

            const div = document.createElement('div');
            div.className = 'flex items-center gap-4 p-3 bg-slate-50 rounded-lg day-row border border-slate-100';
            div.dataset.day = day;

            div.innerHTML = `
                <div class="w-24 font-bold text-xs text-slate-500">${day}</div>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" class="is-working rounded text-indigo-600 focus:ring-indigo-500" ${existing.isWorkingDay ? 'checked' : ''}>
                    <span class="text-xs font-semibold text-slate-700">Active</span>
                </label>
                <div class="flex-1 flex gap-2 items-center justify-end time-inputs ${existing.isWorkingDay ? '' : 'opacity-40 pointer-events-none'} transition-opacity">
                    <input type="time" class="start-time px-2 py-1 border rounded text-xs text-slate-600 font-mono" value="${existing.startTime ? existing.startTime.substring(0, 5) : '09:00'}">
                    <span class="text-xs text-slate-400">-</span>
                    <input type="time" class="end-time px-2 py-1 border rounded text-xs text-slate-600 font-mono" value="${existing.endTime ? existing.endTime.substring(0, 5) : '18:00'}">
                </div>
            `;

            // Toggle logic
            div.querySelector('.is-working').addEventListener('change', (e) => {
                const inputs = div.querySelector('.time-inputs');
                if (e.target.checked) {
                    inputs.classList.remove('opacity-40', 'pointer-events-none');
                } else {
                    inputs.classList.add('opacity-40', 'pointer-events-none');
                }
                document.getElementById('saveScheduleBtn').classList.remove('hidden');
            });

            // Detect changes to show save button
            div.querySelectorAll('input[type="time"]').forEach(i => i.addEventListener('change', () => {
                document.getElementById('saveScheduleBtn').classList.remove('hidden');
            }));

            container.appendChild(div);
        });

        // Hide save button initially
        document.getElementById('saveScheduleBtn').classList.add('hidden');
    },

    handleSaveSchedule: async () => {
        const id = StaffManager.state.selectedStaffId;
        const rows = document.querySelectorAll('.day-row');
        const schedules = [];

        rows.forEach(row => {
            const day = row.dataset.day;
            const isWorking = row.querySelector('.is-working').checked;
            const start = row.querySelector('.start-time').value;
            const end = row.querySelector('.end-time').value;

            // Only send valid times or defaults
            schedules.push({
                dayOfWeek: day,
                isWorkingDay: isWorking,
                startTime: isWorking ? (start || '09:00') : null,
                endTime: isWorking ? (end || '18:00') : null
            });
        });

        try {
            const res = await ManageStaffService.setWorkingHours(id, schedules); // Endpoint expects list direct or wrapper?
            // Controller: setWorkingHours(@RequestBody List<WorkingHoursRequest>)
            // Service: setWorkingHours(id, requests)
            if (res.success) {
                showToast("Schedule updated", "success");
                document.getElementById('saveScheduleBtn').classList.add('hidden');
                // Refresh data
                const refresh = await ManageStaffService.getStaffDetail(id);
                if (refresh.success) StaffManager.state.selectedStaffData = refresh.data;
            } else {
                showToast("Update failed", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error saving schedule", "error");
        }
    },

    renderServicesList: (services) => {
        const container = document.getElementById('modalServicesList');
        if (!services || services.length === 0) {
            container.innerHTML = '<p class="text-sm text-slate-400 italic w-full text-center py-4">No services assigned yet.</p>';
            return;
        }

        container.innerHTML = services.map(s => `
            <div class="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-2 border border-indigo-100 group">
                ${s.name}
                <button onclick="StaffManager.removeService(${s.id})" class="text-indigo-300 hover:text-red-500 transition-colors" title="Remove">
                    &times;
                </button>
            </div>
        `).join('');
    },

    assignService: async () => {
        const select = document.getElementById('serviceSelect');
        const serviceId = select.value;
        if (!serviceId) return;

        const staffId = StaffManager.state.selectedStaffId;

        try {
            // API expects list of IDs? Controller: assignServicesToStaff(id, List<Long> serviceIds)
            const res = await ManageStaffService.assignServicesToStaff(staffId, [parseInt(serviceId)]);
            if (res.success) {
                showToast("Service assigned", "success");
                select.value = "";
                // Refresh
                StaffManager.reloadDetails(staffId);
            } else {
                showToast(res.message, "error");
            }
        } catch (e) { console.error(e); }
    },

    removeService: async (serviceId) => {
        if (!confirm("Remove this service assignment?")) return;
        const staffId = StaffManager.state.selectedStaffId;
        try {
            const res = await ManageStaffService.removeServiceFromStaff(staffId, serviceId);
            if (res.success) {
                showToast("Service removed", "success");
                StaffManager.reloadDetails(staffId);
            }
        } catch (e) { console.error(e); }
    },

    renderLeavesList: (leaves) => {
        const container = document.getElementById('modalLeaveList');
        if (!leaves || leaves.length === 0) {
            container.innerHTML = '<p class="text-sm text-slate-400 italic text-center py-4">No upcoming leaves.</p>';
            return;
        }

        container.innerHTML = leaves.map(l => `
            <div class="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                <div>
                    <div class="text-sm font-bold text-slate-700">${new Date(l.leaveDate).toLocaleDateString()}</div>
                    <div class="text-xs text-slate-500">
                        ${l.startTime ? `${l.startTime.substring(0, 5)} - ${l.endTime.substring(0, 5)}` : 'Full Day'}
                        ${l.reason ? ` • ${l.reason}` : ''}
                    </div>
                </div>
                <button onclick="StaffManager.deleteLeave(${l.id})" class="text-xs text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded">Cancel</button>
            </div>
        `).join('');
    },

    handleAddLeave: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            leaveDate: fd.get('leaveDate'),
            startTime: fd.get('startTime') || null,
            endTime: fd.get('endTime') || null,
            reason: fd.get('reason')
        };
        const staffId = StaffManager.state.selectedStaffId;

        try {
            const res = await ManageStaffService.addStaffLeave(staffId, data);
            if (res.success || res.status === 200) { // Some endpoints return empty body 200
                showToast("Leave granted", "success");
                e.target.reset();
                StaffManager.reloadDetails(staffId);
            } else {
                showToast("Failed to add leave", "error");
            }
        } catch (err) { console.error(err); }
    },

    deleteLeave: async (leaveId) => {
        if (!confirm("Cancel this leave?")) return;
        const staffId = StaffManager.state.selectedStaffId;
        try {
            const res = await ManageStaffService.removeStaffLeave(staffId, leaveId);
            if (res.success) {
                showToast("Leave cancelled", "success");
                StaffManager.reloadDetails(staffId);
            }
        } catch (e) { console.error(e); }
    },

    reloadDetails: async (id) => {
        const res = await ManageStaffService.getStaffDetail(id);
        if (res.success) {
            StaffManager.state.selectedStaffData = res.data;
            StaffManager.populateDetailModal(res.data);
            StaffManager.loadAllData(); // Refresh table counts too
        }
    },
};

const StaffUI = {
    openModal: (id) => {
        document.getElementById(id).classList.remove('hidden');
        document.body.classList.add('modal-active');
        if (id === 'staffDetailModal') {
            StaffUI.switchTab('overview'); // Default tab
        }
    },
    closeModal: (id) => {
        document.getElementById(id).classList.add('hidden');
        document.body.classList.remove('modal-active');
    },
    switchTab: (tabName) => {
        // Hide all contents
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        // Show target
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        // This relies on order or simple text matching; let's use onclick mapping or just match text logic
        // Easier: passed tabName matches logic manually? 
        // Let's iterate buttons to find which triggered? No.
        // Simple fix: Add ID to buttons or manage active class explicitly.
        // Or simpler:
        const btns = document.querySelectorAll('.tab-btn');
        if (tabName === 'overview') btns[0].classList.add('active');
        if (tabName === 'services') btns[1].classList.add('active');
        if (tabName === 'leaves') btns[2].classList.add('active');
    },
    openServiceSelector: () => {
        document.getElementById('serviceSelectorArea').classList.remove('hidden');
    }
};

window.StaffUI = StaffUI;
window.StaffManager = StaffManager;

document.addEventListener('DOMContentLoaded', StaffManager.init);
