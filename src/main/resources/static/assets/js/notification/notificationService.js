const notificationService = {
    // 1. Get unread (for the dropdown)
    async getUnread() {
        return await request('/notifications/unread', 'GET');
    },

    // 2. Get all (for notification.html)
    async getAll() {
        return await request('/notifications/all', 'GET');
    },

    async getNotificationCount() {
        return await request(`/notifications/count`, 'GET');
    },

    // 3. Mark single as read
    async markAsRead(id) {
        return await request(`/notifications/mark-read/${id}`, 'POST');
    },

    // 4. Mark all as read
    async markAllRead() {
        return await request('/notifications/mark-all-read', 'POST');
    },

    // 5. WebSocket setup (remains standard SockJS/Stomp)
    initWebSocket(token, onMessage) {
        const socket = new SockJS('/ws-notifications');
        const stompClient = Stomp.over(socket);

        // Disable debug logging
        // stompClient.debug = null;

        stompClient.connect(
            { 'Authorization': `Bearer ${token}` },
            () => {
                // Success: subscribe to notifications
                stompClient.subscribe(`/user/queue/notifications`, (res) => {
                    onMessage(JSON.parse(res.body));
                });
            },
            (error) => {
                // Error callback
                console.error('WebSocket connection failed:', error);
            }
        );

        // Return for later disconnect (e.g., on logout)
        return stompClient;
    },

    // --- Helpers ---
    getTypeIcon(type, sizeClass = 'w-6 h-6') {
        const icons = {
            'ORDER_PLACED': `<svg class="${sizeClass} text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
            'ORDER_CANCELLED': `<svg class="${sizeClass} text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
            'ORDER_SHIPPED': `<svg class="${sizeClass} text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
            'ORDER_DELIVERED': `<svg class="${sizeClass} text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
            'APPOINTMENT_BOOKED': `<svg class="${sizeClass} text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
            'APPOINTMENT_CANCELLED': `<svg class="${sizeClass} text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
            'DRIVER_ASSIGN': `<svg class="${sizeClass} text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>`,
        };
        return icons[type] || `<svg class="${sizeClass} text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`;
    },

    formatDate(dateString) {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }
};
