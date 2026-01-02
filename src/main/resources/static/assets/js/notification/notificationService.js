const notificationService = {
    // 1. Get unread (for the dropdown)
    async getUnread() {
        return await request('/notifications/unread', 'GET');
    },

    // 2. Get all (for notification.html)
    async getAll() {
        return await request('/notifications/all', 'GET');
    },

    async getNotificationCount(){
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
    initWebSocket(userId, onMessage) {
        const socket = new SockJS('/ws-notifications');
        const stompClient = Stomp.over(socket);
        // Use token if your WebSocket security requires it
        const token = localStorage.getItem('accessToken');
        stompClient.connect({ Authorization: `Bearer ${token}` }, () => {
            stompClient.subscribe(`/user/${userId}/queue/notifications`, (res) => {
                onMessage(JSON.parse(res.body));
            });
        });
    }
};