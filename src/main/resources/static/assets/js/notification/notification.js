document.addEventListener('DOMContentLoaded', () => {
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const notifList = document.getElementById('notificationItemsList');
    const badgeContainer = document.getElementById('notificationCount');
    const markAllBtn = document.getElementById('markAllReadBtn');
    const pingEffect = document.getElementById('notifPing');

    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = notifDropdown.classList.contains('invisible');
        if (isHidden) {
            openDropdown();
        } else {
            closeDropdown();
        }
    });

    async function openDropdown() {
        notifDropdown.classList.remove('invisible', 'opacity-0', 'translate-y-1');
        notifDropdown.classList.add('visible', 'opacity-100', 'translate-y-0');
        await refreshDropdownData();
    }

    function closeDropdown() {
        notifDropdown.classList.add('invisible', 'opacity-0', 'translate-y-1');
        notifDropdown.classList.remove('visible', 'opacity-100', 'translate-y-0');
    }

    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target)) closeDropdown();
    });

    // --- 2. RENDER DROPDOWN ITEMS ---
    async function refreshDropdownData() {
        const res = await notificationService.getUnread();
        if (res.success) {
            updateBadgeUI(res.data.length);
            renderList(res.data, notifList);
        }
    }

    function renderList(notifications, container) {
        if (!notifications.length) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center p-12 text-slate-300">
                    <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2-2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">All Caught Up!</p>
                </div>`;
            return;
        }

        container.innerHTML = notifications.map(notif => {
            const icon = notificationService.getTypeIcon(notif.type, 'w-4 h-4');
            return `
            <div class="group relative flex items-center px-6 py-5 border-b border-slate-50 hover:bg-blue-50/50 transition-all duration-300 overflow-hidden cursor-pointer" data-id="${notif.id}">
                <div class="flex gap-4 items-start flex-1 transition-all duration-300 group-hover:pr-20">
                    <div class="flex-shrink-0 p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                        ${icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-0.5">
                            <h4 class="text-sm font-bold text-slate-800 truncate pr-2">${notif.title}</h4>
                            <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">${notificationService.formatDate(notif.createdAt)}</span>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">${notif.message}</p>
                    </div>
                </div>
                <button onclick="handleMarkRead('${notif.id}', event)" 
                    class="absolute right-0 top-0 bottom-0 w-20 bg-blue-600 text-white flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </button>
            </div>
        `}).join('');
    }

    // --- 3. BADGE & LIVE ANIMATION ---
    window.updateBadgeUI = (count) => {
        const badgeText = badgeContainer.querySelector('.notif-count-text');
        if (count > 0) {
            badgeText.innerText = count > 9 ? '9+' : count;
            badgeContainer.classList.remove('hidden');
            badgeContainer.classList.add('flex');
        } else {
            badgeContainer.classList.add('hidden');
        }
    };

    function triggerLivePing() {
        pingEffect.classList.add('animate-ping');
        setTimeout(() => {
            pingEffect.classList.remove('animate-ping');
        }, 1500);
    }

    // --- 4. ACTIONS ---
    window.handleMarkRead = async (id, event) => {
        event.stopPropagation();
        const res = await notificationService.markAsRead(id);
        if (res.success) {
            const el = document.querySelector(`[data-id="${id}"]`);
            el.classList.add('opacity-0', '-translate-x-10');
            setTimeout(() => {
                refreshDropdownData();
            }, 300);
        }
    };

    markAllBtn.addEventListener('click', async () => {
        const res = await notificationService.markAllRead();
        if (res.success) refreshDropdownData();
    });

    // --- 5. INITIALIZE LIVE WEBSOCKET ---
    const currentUser = localStorage.getItem('accessToken');
    if (currentUser) {
        refreshDropdownData();
        notificationService.initWebSocket(currentUser, (newNotif) => {
            triggerLivePing();
            refreshDropdownData();
            showToast(newNotif.message || "New Notification", "info");
        });
    }
});

