const StaffDashboard = {
    state: {
        activeTab: 'overview',
        profile: null,
        upcomingAppointments: [],
        services: [],
        history: [],
        schedule: [],
        leaves: []
    },

    init: async function () {
        await this.loadInitialData();
        this.setupEventListeners();
        this.renderTab('overview');
    },

    loadInitialData: async function () {
        const profileRes = await StaffService.getProfile();

        if (profileRes.success) {
            this.state.profile = profileRes.data.staffListResponse;
            this.state.schedule = profileRes.data.workingHours;
            this.state.services = profileRes.data.services;
            this.updateProfileUI();
        }
    },

    updateProfileUI: function () {
        const nameEl = document.getElementById('sidebarName');
        const roleEl = document.getElementById('sidebarRole');
        const imgEl = document.getElementById('sidebarProfilePic');
        const navUsername = document.getElementById('navUsername');
        const navProfilePic = document.getElementById('navProfilePic');

        if (nameEl) nameEl.textContent = this.state.profile.fullName;
        if (roleEl) roleEl.textContent = this.state.profile.expertiseIn;
        if (imgEl && this.state.profile.profileUrl) imgEl.src = this.state.profile.profileUrl;

        if (navUsername) navUsername.textContent = this.state.profile.fullName;
        if (navProfilePic && this.state.profile.profileUrl) navProfilePic.src = this.state.profile.profileUrl;
    },

    switchTab: async function (tabId) {
        this.state.activeTab = tabId;

        // Update Sidebar UI
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'text-white');
            btn.classList.add('text-slate-300', 'hover:bg-white/5');

            if (btn.dataset.tab === tabId) {
                btn.classList.add('active', 'bg-blue-600', 'text-white');
                btn.classList.remove('text-slate-300', 'hover:bg-white/5');
            }
        });

        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar')?.classList.add('-translate-x-full');
            document.getElementById('sidebarBackdrop')?.classList.add('opacity-0', 'invisible');
        }

        // Ensure data is loaded for the tab
        await this.ensureTabData(tabId);

        this.renderTab(tabId);
    },

    ensureTabData: async function (tabId) {
        const container = document.getElementById('tabContent');

        switch (tabId) {
            case 'upcoming':
                if (this.state.upcomingAppointments.length === 0) {
                    this.renderLoading(container);
                    const res = await StaffService.getUpcomingAppointments();
                    if (res.success) this.state.upcomingAppointments = res.data;
                }
                break;
            case 'history':
                if (this.state.history.length === 0) {
                    this.renderLoading(container);
                    const res = await StaffService.getAppointmentHistory();
                    if (res.success) this.state.history = res.data;
                }
                break;
            case 'leave':
                if (this.state.leaves.length === 0) {
                    this.renderLoading(container);
                    const res = await StaffService.getLeaves();
                    if (res.success) this.state.leaves = res.data;
                }
                break;
        }
    },

    renderLoading: function (container) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        `;
    },

    renderTab: function (tabId) {
        const container = document.getElementById('tabContent');
        if (!container) return;

        switch (tabId) {
            case 'overview':
                this.renderOverview(container);
                break;
            case 'details':
                this.renderDetails(container);
                break;
            case 'upcoming':
                this.renderUpcoming(container);
                break;
            case 'history':
                this.renderHistory(container);
                break;
            case 'schedule':
                this.renderSchedule(container);
                break;
            case 'leave':
                this.renderLeave(container);
                break;
        }
    },

    renderOverview: function (container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Services</p>
                                <h3 class="text-2xl font-bold text-slate-800">${this.state.services.length}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-lg font-bold text-slate-800">Your Expertise & Services</h2>
                        <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">${this.state.profile.expertiseIn}</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${this.state.services.map(s => `
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all group">
                                <h4 class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">${s.name}</h4>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="text-[10px] text-slate-500 font-medium">${s.category}</span>
                                    <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span class="text-[10px] text-blue-600 font-bold">${s.durationMinutes} mins</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderDetails: function (container) {
        const p = this.state.profile;
        container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-600 to-blue-800 h-40 relative">
                        <div class="absolute -bottom-16 left-12 w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl">
                            <img src="${p.profileUrl || 'https://ui-avatars.com/api/?name=' + p.fullName}" class="w-full h-full rounded-2xl object-cover shadow-inner">
                        </div>
                    </div>
                    <div class="pt-20 pb-10 px-12 space-y-8">
                        <div class="flex justify-between items-start">
                            <div>
                                <h2 class="text-3xl font-extrabold text-slate-900">${p.fullName}</h2>
                                <p class="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">${p.expertiseIn}</p>
                                <p class="text-slate-500 text-sm mt-2">Member since: ${p.joinedDate}</p>
                            </div>
                            <div class="flex gap-2">
                                <span class="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold ring-1 ring-green-100">Active</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
                            <div class="space-y-6">
                                <div class="flex items-center gap-3 text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span class="text-sm font-medium">${p.username}</span>
                                </div>
                                <div>
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Contact Details</label>
                                    <div class="space-y-3">
                                        <div class="flex items-center gap-3 text-slate-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span class="text-sm font-medium">${p.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-6">
                                <div>
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Assigned Services</label>
                                    <div class="flex flex-wrap gap-2">
                                        ${this.state.services.slice(0, 6).map(s => `<span class="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold ring-1 ring-blue-100">${s.name}</span>`).join('')}
                                        ${this.state.services.length > 6 ? `<span class="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-bold">+${this.state.services.length - 6} more</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderUpcoming: function (container) {
        if (this.state.upcomingAppointments.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-3xl p-12 text-center border border-slate-100">
                    <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800">No upcoming appointments</h3>
                    <p class="text-sm text-slate-500 mt-2">You're all caught up for now!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden shadow-2xl shadow-blue-900/5">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                        <tr>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Appointment Time</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${this.state.upcomingAppointments.map(apt => `
                            <tr class="hover:bg-blue-50/30 transition-colors group">
                                <td class="p-6">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-bold text-slate-800">#${apt.appointmentId}</span>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">${apt.username.charAt(0)}</div>
                                        <span class="text-sm font-bold text-slate-800">${apt.username}</span>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="text-sm font-medium text-slate-600">${apt.response.name}</div>
                                </td>
                                <td class="p-6">
                                    <div class="text-sm font-bold text-slate-800">${apt.appointmentDate}</div>
                                    <div class="text-[10px] text-slate-400 mt-0.5">${apt.startTime} - ${apt.endTime}</div>
                                </td>
                                <td class="p-6">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-bold text-slate-800">${apt.status}</span>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderHistory: function (container) {
        if (this.state.history.length === 0) {
            container.innerHTML = `<div class="p-12 text-center text-slate-500 font-bold">No appointment history found</div>`;
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden shadow-2xl shadow-blue-900/5">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                        <tr>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Appointment Time</th>
                            <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${this.state.history.map(apt => `
                            <tr class="hover:bg-blue-50/30 transition-colors group">
                                <td class="p-6">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-bold text-slate-800">#${apt.appointmentId}</span>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">${apt.username.charAt(0)}</div>
                                        <span class="text-sm font-bold text-slate-800">${apt.username}</span>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="text-sm font-medium text-slate-600">${apt.response.name}</div>
                                </td>
                                <td class="p-6">
                                    <div class="text-sm font-bold text-slate-800">${apt.appointmentDate}</div>
                                    <div class="text-[10px] text-slate-400 mt-0.5">${apt.startTime} - ${apt.endTime}</div>
                                </td>
                                <td class="p-6">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-bold text-slate-800">${apt.status}</span>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSchedule: function (container) {
        const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <h3 class="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">Weekly Working Hours</h3>
                    <div class="space-y-4">
                        ${days.map(dayName => {
            const scheduleDay = this.state.schedule.find(s => s.dayOfWeek.toUpperCase() === dayName);
            const isWorking = scheduleDay && scheduleDay.isWorkingDay;
            return `
                                    <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-50 group hover:border-blue-100 transition-all">
                                        <div class="flex items-center gap-4">
                                            <div class="w-2 h-2 rounded-full ${isWorking ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}"></div>
                                            <span class="text-sm font-bold ${isWorking ? 'text-slate-800' : 'text-slate-400'}">${dayName.charAt(0) + dayName.slice(1).toLowerCase()}</span>
                                        </div>
                                        <div class="flex items-center gap-6">
                                            ${isWorking ? `
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">${scheduleDay.startTime}</span>
                                                    <span class="text-xs text-slate-400 font-bold">to</span>
                                                    <span class="text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">${scheduleDay.endTime}</span>
                                                </div>
                                            ` : `
                                                <span class="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest">Not Working</span>
                                            `}
                                        </div>
                                    </div>
                                `;
        }).join('')}
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 text-white overflow-hidden relative group">
                        <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                        <h3 class="text-sm font-bold text-white/60 uppercase tracking-widest mb-3">Today's Shift</h3>
                        <div class="mb-3">
                            <p class="text-2xl font-black uppercase">${new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())}</p>   
                        </div>
                        <div class="space-y-1">
                            <p class="text-xs font-medium text-white/50 uppercase">Current Time Status</p>                 
                            <p class="text-2xl font-black tabular-nums" id="clock">00:00:00</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Start local clock
        const updateClock = () => {
            const now = new Date();
            const clockEl = document.getElementById('clock');
            if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour12: false });
        };
        setInterval(updateClock, 1000);
        updateClock();
    },

    renderLeave: function (container) {
        container.innerHTML = `
            <div class="space-y-8">
                <div class="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">Leave Management</h2>
                        <p class="text-xs text-slate-500 font-medium">Track and request your leaves</p>
                    </div>
                    <button onclick="StaffDashboard.openLeaveModal()" class="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
                        </svg>
                        Request New Leave
                    </button>
                </div>

                <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden shadow-2xl shadow-blue-900/5">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave ID</th>
                                <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave Date</th>
                                <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Slot</th>
                                <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                                <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8">Status</th>
                                <th class="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${this.state.leaves.length === 0 ? `<tr><td colspan="5" class="p-12 text-center text-slate-400 font-bold">No leave requests found</td></tr>` :
                this.state.leaves.map(l => `
                                    <tr class="group">
                                        <td class="p-6">
                                            <div class="text-sm font-bold text-slate-800">${l.id}</div>
                                        </td>
                                        <td class="p-6">
                                            <div class="text-sm font-bold text-slate-800">${l.leaveDate}</div>
                                        </td>
                                        <td class="p-6">
                                            ${l.startTime && l.endTime ? `
                                                <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                                    <span class="text-[10px] font-bold text-slate-700">${l.startTime}</span>
                                                    <span class="text-[10px] text-slate-400">-</span>
                                                    <span class="text-[10px] font-bold text-slate-700">${l.endTime}</span>
                                                </div>
                                            ` : `
                                                <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg ring-1 ring-blue-100">FULL DAY</span>
                                            `}
                                        </td>
                                        <td class="p-6 text-sm text-slate-500 font-medium max-w-xs truncate" title="${l.reason}">${l.reason}</td>
                                        <td class="p-6 px-8">
                                            <span class="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm ring-1 ring-inset ${l.status === 'APPROVED' ? 'bg-green-50 text-green-700 ring-green-100' :
                        l.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-red-100' :
                            'bg-yellow-50 text-yellow-700 ring-yellow-100'
                    }">${l.status}</span>
                                        </td>
                                        <td class="p-6 text-right">
                                            ${l.status === 'PENDING' ? `
                                                <button onclick="StaffDashboard.handleLeaveCancel('${l.id}')" class="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all group-hover:scale-110" title="Cancel Request">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            ` : '-'}
                                        </td>
                                    </tr>
                                `).join('')
            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    openLeaveModal: function () {
        document.getElementById('leaveModal').classList.remove('hidden');
        document.getElementById('leaveModal').classList.add('flex');
    },

    closeLeaveModal: function () {
        document.getElementById('leaveModal').classList.add('hidden');
        document.getElementById('leaveModal').classList.remove('flex');
    },

    handleLeaveSubmit: async function (e) {
        e.preventDefault();
        const form = e.target;
        const data = {
            leaveDate: form.leaveDate.value,
            startTime: form.startTime.value || null,
            endTime: form.endTime.value || null,
            reason: form.reason.value.trim()
        }

        const response = await StaffService.requestLeave(data);
        if (response.success) {
            showToast(response.message || "Leave request submitted", "success");
            this.closeLeaveModal();
            // Refresh leaves cache
            const res = await StaffService.getLeaves();
            if (res.success) {
                this.state.leaves = res.data;
                if (this.state.activeTab === 'leave') this.renderTab('leave');
            }
        } else {
            showToast(response.message || "Request failed", "error");
        }
    },

    handleLeaveCancel: async function (leaveId) {
        if (!confirm("Are you sure you want to cancel this leave request?")) return;

        const response = await StaffService.cancelLeave(leaveId);
        if (response.success) {
            showToast("Leave canceled successfully", "success");
            const res = await StaffService.getLeaves();
            if (res.success) {
                this.state.leaves = res.data;
                this.renderTab('leave');
            }
        }
    },

    handleLogout: async function () {
        if (confirm("Are you sure you want to logout?")) {
            const response = await AuthService.logout();
            if (response.success) {
                window.location.href = '../login.html';
            } else {
                showToast("Logout failed", "error");
            }
        }
    },

    setupEventListeners: function () {
        document.getElementById('leaveForm')?.addEventListener('submit', (e) => this.handleLeaveSubmit(e));

        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        const backdrop = document.getElementById('sidebarBackdrop');

        const toggleSidebar = () => {
            // Mobile behavior
            if (window.innerWidth < 1024) {
                sidebar.classList.toggle('-translate-x-full');

                // Toggle Backdrop
                if (sidebar.classList.contains('-translate-x-full')) {
                    backdrop?.classList.add('opacity-0', 'invisible');
                } else {
                    backdrop?.classList.remove('opacity-0', 'invisible');
                }

            } else {
                // Desktop behavior: Collapse/Expand
                sidebar.classList.toggle('w-72');
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

                // Handle Profile Section visibility
                const profileSection = document.getElementById('profileSection');
                const profilePicContainer = sidebar.querySelector('.profile-pic-container');

                if (profileSection) {
                    if (sidebar.classList.contains('w-20')) {
                        // Minimized state
                        if (profilePicContainer) {
                            profilePicContainer.classList.remove('w-20', 'h-20', 'mb-3');
                            profilePicContainer.classList.add('w-10', 'h-10', 'mb-0');
                        }
                    } else {
                        // Expanded state
                        if (profilePicContainer) {
                            profilePicContainer.classList.add('w-20', 'h-20', 'mb-3');
                            profilePicContainer.classList.remove('w-10', 'h-10', 'mb-0');
                        }
                    }
                }
            }
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleSidebar);
        }

        // Close sidebar when clicking backdrop (Mobile)
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                sidebar.classList.add('-translate-x-full');
                backdrop.classList.add('opacity-0', 'invisible');
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => StaffDashboard.init());
