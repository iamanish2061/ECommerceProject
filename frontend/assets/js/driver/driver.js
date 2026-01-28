
const DriverDashboard = {
    state: {
        profile: null,
        activeTab: 'assigned',
        maps: {},
        routingControls: {},
        globalRouteMap: null,
        globalRouteControl: null,
        currentDeliveryIndex: 0,
        storeLocation: null,
        deliveryAddresses: []
    },

    init: async function () {
        await this.loadProfile();
        this.setupEventListeners();

        const wasSynced = this.getCookie('driver_assignments_synced') === 'true';
        const initialTab = window.location.hash.replace('#', '') || 'assigned';
        this.switchTab(initialTab);

        if (wasSynced && initialTab === 'assigned') {
            this.handleFetchAssignments();
        }

        window.addEventListener('hashchange', () => {
            const tabId = window.location.hash.replace('#', '') || 'assigned';
            if (this.state.activeTab !== tabId) this.switchTab(tabId, false);
        });
    },

    loadProfile: async function () {
        try {
            const response = await driverService.getProfile();
            if (response.success) {
                this.state.profile = response.data;
                this.updateSidebarUI();
            }
        } catch (error) {
            console.error('Error loading driver profile:', error);
        }
    },

    updateSidebarUI: function () {
        const p = this.state.profile;
        if (!p) return;

        const nameEl = document.getElementById('sidebarName');
        const imgEl = document.getElementById('sidebarProfilePic');

        if (nameEl) nameEl.textContent = p.fullName || 'Driver';
        if (imgEl && p.profileUrl) imgEl.src = p.profileUrl;
    },

    // ===== TAB NAVIGATION =====
    switchTab: function (tabId, updateHash = true) {
        if (!['assigned', 'details'].includes(tabId)) tabId = 'assigned';
        this.state.activeTab = tabId;
        if (updateHash) window.location.hash = tabId;

        ['assigned', 'details'].forEach(t => {
            const btn = document.getElementById(`tab-${t}`);
            const view = document.getElementById(`view-${t}`);
            if (!btn || !view) return;

            const isActive = t === tabId;
            btn.className = `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${isActive ? 'text-brand-700 bg-brand-50 shadow-sm border border-brand-100' : 'text-gray-600 hover:bg-gray-50'
                }`;
            view.classList.toggle('hidden', !isActive);
        });

        this.closeMobileSidebar();

        if (tabId === 'assigned') {
            this.renderAssignedView();
            if (this.state.deliveryAddresses.length > 0 || this.state.storeLocation) {
                this.initGlobalRouteMap();
            }
        } else {
            this.renderDetailsView();
            document.getElementById('globalRouteMapWrapper')?.classList.add('hidden');
        }
    },

    // ===== ASSIGNED DELIVERIES =====
    renderAssignedView: function () {
        const container = document.getElementById('deliveries-container');
        if (!container) return;

        container.className = "bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col justify-center items-center p-8";

        if (this.state.deliveryAddresses.length > 0 || this.state.storeLocation) {
            this.renderDeliveriesList();
        } else {
            const tmpl = document.getElementById('tmpl-check-assignments');
            container.innerHTML = '';
            const content = tmpl.content.cloneNode(true);
            const btn = content.getElementById('checkAssignmentsBtn');
            if (btn) btn.onclick = () => this.handleFetchAssignments();
            container.appendChild(content);
        }
    },

    handleFetchAssignments: async function () {
        if (this.state.deliveryAddresses.length > 0 || this.state.storeLocation) {
            this.renderDeliveriesList();
            return;
        }

        const container = document.getElementById('deliveries-container');
        container.innerHTML = '<div class="text-center animate-bounce py-12 text-brand-600">Checking for assignments...</div>';

        try {
            const driverId = this.state.profile?.response?.id;
            if (!driverId) {
                showToast("Failed to identify driver", "error");
                this.renderAssignedView();
                return;
            }

            const res = await driverService.getAssignedDeliveries(driverId);
            if (res.success && res.data?.length >= 2) {
                // First is store, middle are deliveries, last is store again (discard)
                this.state.storeLocation = res.data[0];
                this.state.deliveryAddresses = res.data.slice(1, -1);

                this.state.currentDeliveryIndex = 0;
                this.setCookie('driver_assignments_synced', 'true', 1);

                this.renderDeliveriesList();
                this.initGlobalRouteMap();
                showToast(`Assignments loaded`, "success");
            } else {
                this.state.deliveryAddresses = [];
                this.state.storeLocation = null;
                this.setCookie('driver_assignments_synced', 'true', 1);
                this.cleanupGlobalMap();
                document.getElementById('globalRouteMapWrapper')?.classList.add('hidden');
                container.innerHTML = document.getElementById('tmpl-not-assigned').innerHTML;
            }
        } catch (error) {
            console.error('Error loading deliveries:', error);
            container.innerHTML = '<div class="text-red-500 text-center">Failed to load deliveries. Please try again.</div>';
        }
    },

    renderDeliveriesList: function () {
        const container = document.getElementById('deliveries-container');
        if (!container) return;

        container.className = "bg-transparent shadow-none border-none w-full space-y-6";
        container.innerHTML = '';

        if (this.state.deliveryAddresses.length === 0 && !this.state.storeLocation) {
            const wasSynced = this.getCookie('driver_assignments_synced') === 'true';
            if (!wasSynced) {
                this.handleFetchAssignments();
                return;
            }
            container.innerHTML = document.getElementById('tmpl-not-assigned')?.innerHTML || '';
            return;
        }

        Object.keys(this.state.maps).forEach(id => this.cleanupMap(id));

        const isReturn = this.state.currentDeliveryIndex >= this.state.deliveryAddresses.length;

        if (!isReturn) {
            // Render CURRENT Delivery Address
            const delivery = this.state.deliveryAddresses[this.state.currentDeliveryIndex];
            const card = document.getElementById('tmpl-delivery-card').content.cloneNode(true);
            const mapWrapper = card.querySelector('.map-wrapper');
            const mapId = `map-${delivery.orderId}`;
            mapWrapper.querySelector('div').id = mapId;

            card.querySelector('.order-id').textContent = delivery.orderId;
            card.querySelector('.customer-name').textContent = delivery.username;
            card.querySelector('.customer-phone').textContent = delivery.phoneNumber;
            card.querySelector('.customer-address').textContent = [delivery.landmark, delivery.place, delivery.district].filter(Boolean).join(', ') || 'N/A';

            const sBtn = card.querySelector('.btn-start');
            const cBtn = card.querySelector('.btn-complete');

            const status = delivery.status?.toUpperCase() || 'PENDING';
            const isShipping = status === 'SHIPPING';

            sBtn.classList.toggle('hidden', isShipping);
            cBtn.classList.toggle('hidden', !isShipping);
            mapWrapper.classList.toggle('hidden', !isShipping);
            this.updateStatusBadge(card, status);

            sBtn.onclick = () => this.handleStartDelivery(delivery, sBtn, cBtn, mapWrapper, mapId);
            cBtn.onclick = () => this.handleCompleteDelivery(delivery);

            container.appendChild(card);
            if (isShipping) this.initMap(mapId, delivery);
        } else if (this.state.storeLocation) {
            // Render Store Return Section
            const store = this.state.storeLocation;
            const returnDiv = document.createElement('div');
            returnDiv.className = 'p-8 rounded-3xl border-2 bg-white border-brand-500 shadow-xl shadow-brand-100/50 transform scale-[1.01] transition-all duration-500 animate-fade-in';

            const fullAddr = [store.landmark, store.place, store.district].filter(Boolean).join(', ');

            returnDiv.innerHTML = `
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div class="flex-1 space-y-4">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Main Base
                        </div>
                        <div>
                            <h3 class="text-2xl font-black text-gray-900 mb-1">Return to Store</h3>
                            <p class="text-gray-600 font-medium text-lg leading-relaxed">${fullAddr}</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-4 flex-shrink-0">
                        <button id="backToStoreBtn" class="px-8 py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Back to Store
                        </button>
                        <button id="completeAllBtn" class="px-8 py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Complete All Orders
                        </button>
                    </div>
                </div>
                <div id="map-return-wrapper" class="hidden mt-8">
                    <div id="map-return" class="h-80 w-full rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 shadow-inner"></div>
                </div>
            `;

            returnDiv.querySelector('#backToStoreBtn').onclick = () => {
                returnDiv.querySelector('#map-return-wrapper').classList.remove('hidden');
                this.initMap('map-return', store);
            };
            returnDiv.querySelector('#completeAllBtn').onclick = () => this.handleCompleteAll();

            container.appendChild(returnDiv);
        }
    },

    handleStartDelivery: async function (delivery, startBtn, completeBtn, mapWrapper, mapId) {
        try {
            showToast("Starting delivery...", "info");
            const res = await driverService.startDelivery(delivery.username, delivery.orderId);
            if (res.success) {
                delivery.status = 'SHIPPING';
                startBtn.classList.add('hidden');
                completeBtn.classList.remove('hidden');
                mapWrapper.classList.remove('hidden');
                this.initMap(mapId, delivery);
                this.updateStatusBadge(startBtn.closest('.bg-white'), 'SHIPPING');
                showToast("Delivery started", "success");
            }
        } catch (err) {
            showToast("Failed to start delivery", "error");
        }
    },

    handleCompleteDelivery: async function (delivery) {
        if (!confirm("Confirm order delivery?")) return;
        try {
            showToast("Completing delivery...", "info");
            const res = await driverService.completeDelivery(delivery.orderId, delivery.username);
            if (res.success) {
                this.cleanupMap(delivery.orderId);
                this.state.currentDeliveryIndex++;
                this.renderDeliveriesList();
                showToast("Order completed!", "success");
            }
        } catch (err) {
            showToast("Failed to complete delivery", "error");
        }
    },

    handleCompleteAll: async function () {
        if (!confirm("Confirm return to base? This will complete the assignment loop.")) return;
        try {
            showToast("Finishing cycle...", "info");
            const res = await driverService.completeAllDelivery();
            if (res.success) {
                this.state.deliveryAddresses = [];
                this.state.storeLocation = null;
                this.state.currentDeliveryIndex = 0;
                this.deleteCookie('driver_assignments_synced');
                this.renderDeliveriesList();
                showToast("All done! Returning home.", "success");
            }
        } catch (err) {
            showToast("Action failed", "error");
        }
    },

    updateStatusBadge: function (card, status) {
        const badge = card?.querySelector('.status-badge');
        if (!badge) return;

        const styles = {
            'SHIPPING': 'bg-blue-100 text-blue-700',
            'DELIVERED': 'bg-green-100 text-green-700',
            'COMPLETED': 'bg-green-100 text-green-700',
            'RETURN': 'bg-orange-100 text-orange-700',
            'PENDING': 'bg-yellow-100 text-yellow-700'
        };

        badge.textContent = status === 'RETURN' ? 'Back to Store' : (status === 'SHIPPING' ? 'In Transit' : status);
        badge.className = `px-3 py-1 rounded-full text-xs font-semibold status-badge ${styles[status] || styles.PENDING}`;
    },

    // ===== DETAILS VIEW =====
    renderDetailsView: function () {
        const container = document.getElementById('details-container');
        if (!this.state.profile) {
            container.innerHTML = '<div class="text-red-500">Failed to load details.</div>';
            return;
        }

        const info = this.state.profile.response;
        const tmpl = document.getElementById('tmpl-driver-details');
        container.innerHTML = '';
        const content = tmpl.content.cloneNode(true);

        const statusEl = content.getElementById('detail-verified');
        const isVerified = info.verified === 'VERIFIED';
        statusEl.textContent = info.verified || 'PENDING';
        statusEl.className = `px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`;

        content.getElementById('detail-licenseNumber').textContent = info.licenseNumber || 'N/A';
        content.getElementById('detail-licenseExpiry').textContent = info.licenseExpiry || 'N/A';
        content.getElementById('detail-vehicleNumber').textContent = info.vehicleNumber || 'N/A';

        const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
        content.getElementById('detail-submittedAt').textContent = formatDate(info.submittedAt);
        content.getElementById('detail-verifiedAt').textContent = formatDate(info.verifiedAt);

        const licenseLink = content.getElementById('detail-licenseUrl');
        if (info.licenseUrl) {
            licenseLink.onclick = () => this.openLicenseModal(info.licenseUrl);
        } else {
            licenseLink.classList.add('hidden');
        }

        container.appendChild(content);
    },

    // ===== MAPS & ROUTING =====
    initGlobalRouteMap: function () {
        const wrapper = document.getElementById('globalRouteMapWrapper');
        const c = document.getElementById('globalRouteMap');

        if (!c || (!this.state.storeLocation && this.state.deliveryAddresses.length === 0)) {
            wrapper?.classList.add('hidden');
            return;
        }

        wrapper.classList.remove('hidden');

        if (this.state.globalRouteMap) this.state.globalRouteMap.remove();

        const map = L.map('globalRouteMap').setView([27.7172, 85.3240], 13);
        this.state.globalRouteMap = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const userLoc = L.latLng(pos.coords.latitude, pos.coords.longitude);

                // Route: Start -> D1 -> D2 -> ... -> Store
                const wps = [userLoc];
                this.state.deliveryAddresses.forEach(d => {
                    if (d.latitude) wps.push(L.latLng(d.latitude, d.longitude));
                });
                if (this.state.storeLocation) {
                    wps.push(L.latLng(this.state.storeLocation.latitude, this.state.storeLocation.longitude));
                }

                if (wps.length > 1) {
                    this.state.globalRouteControl = L.Routing.control({
                        waypoints: wps,
                        show: false,
                        addWaypoints: false,
                        draggableWaypoints: false,
                        routeWhileDragging: false,
                        lineOptions: { styles: [{ color: '#1e3a8a', weight: 6 }] },
                        createMarker: (i, wp) => {
                            const isStart = i === 0;
                            const isEnd = i === wps.length - 1;
                            const label = isStart ? 'S' : (isEnd ? '🏠' : i);
                            const icon = L.divIcon({
                                className: `custom-marker ${isStart ? 'start' : (isEnd ? 'store' : '')}`,
                                html: `<span>${label}</span>`,
                                iconSize: [24, 24]
                            });
                            const title = isStart ? 'You' : (isEnd ? 'Store' : `Order ${i}`);
                            return L.marker(wp.latLng, { icon }).bindPopup(title);
                        }
                    }).addTo(map);
                }
            });
        }
    },

    cleanupGlobalMap: function () {
        if (this.state.globalRouteMap) {
            this.state.globalRouteMap.remove();
            this.state.globalRouteMap = this.state.globalRouteControl = null;
        }
    },

    initMap: function (mapId, delivery) {
        const tId = delivery.orderId || 'return-base';
        if (this.state.maps[tId]) return;

        const map = L.map(mapId).setView([27.7172, 85.3240], 13);
        this.state.maps[tId] = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const userLoc = L.latLng(pos.coords.latitude, pos.coords.longitude);
                const destLoc = L.latLng(delivery.latitude || 27.7172, delivery.longitude || 85.3240);
                L.Routing.control({ waypoints: [userLoc, destLoc], createMarker: () => null, lineOptions: { styles: [{ color: '#1e3a8a', weight: 6 }] } }).addTo(map);
                L.marker(userLoc).addTo(map).bindPopup('You');
                L.marker(destLoc).addTo(map).bindPopup(delivery.place).openPopup();
            });
        }
    },

    cleanupMap: function (orderId) {
        const tId = orderId || 'return-base';
        if (this.state.maps[tId]) {
            this.state.maps[tId].remove();
            delete this.state.maps[tId];
        }
    },

    // ===== HELPERS & EVENT LISTENERS =====
    setupEventListeners: function () {
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const backdrop = document.getElementById('sidebarBackdrop');

        mobileBtn?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('-translate-x-full');
            backdrop?.classList.remove('opacity-0', 'invisible');
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        backdrop?.addEventListener('click', () => this.closeMobileSidebar());
    },

    closeMobileSidebar: function () {
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar')?.classList.add('-translate-x-full');
            document.getElementById('sidebarBackdrop')?.classList.add('opacity-0', 'invisible');
        }
    },

    handleLogout: async function () {
        if (!confirm("Are you sure you want to logout?")) return;
        try {
            const response = await AuthService.logout();
            if (response.success) {
                this.deleteCookie('driver_assignments_synced');
                this.deleteCookie('driver_delivery_index');
                window.location.href = '../auth/login.html';
            } else {
                showToast("Logout failed", "error");
            }
        } catch (error) {
            showToast("An error occurred during logout", "error");
        }
    },

    openLicenseModal: function (url) {
        const modal = document.getElementById('licenseImageModal');
        const img = document.getElementById('licenseDisplayImg');
        img.src = url;
        modal.classList.replace('hidden', 'flex');
        document.body.style.overflow = 'hidden';
    },

    closeLicenseModal: function () {
        const modal = document.getElementById('licenseImageModal');
        modal.classList.replace('flex', 'hidden');
        document.body.style.overflow = '';
    },

    // ===== COOKIE HELPERS =====
    setCookie: (n, v, d) => {
        let e = "";
        if (d) {
            const dt = new Date();
            dt.setTime(dt.getTime() + (d * 24 * 60 * 60 * 1000));
            e = "; expires=" + dt.toUTCString();
        }
        document.cookie = n + "=" + (v || "") + e + "; path=/";
    },

    getCookie: (n) => {
        const v = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
        return v ? v.pop() : null;
    },

    deleteCookie: (n) => document.cookie = n + '=; Max-Age=-99999999; path=/',
};

function closeLicenseImageModal() { DriverDashboard.closeLicenseModal(); }
document.addEventListener('DOMContentLoaded', () => DriverDashboard.init());
