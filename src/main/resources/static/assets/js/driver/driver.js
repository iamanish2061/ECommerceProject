document.addEventListener('DOMContentLoaded', () => {
    init();
});

let currentDriver = null;
let activeMaps = {}; // To store map instances for each order
let currentRoutingControls = {}; // To store routing controls for each order

async function init() {
    await loadDriverProfile();
    // Default tab is assigned deliveries
    switchTab('assigned');
}

async function loadDriverProfile() {
    try {
        const response = await driverService.getProfile();
        if (response.success) {
            currentDriver = response.data;
            updateUIWithDriverData(currentDriver);
        } else {
            console.error('Failed to load driver profile:', response.message);
        }
    } catch (error) {
        console.error('Error loading driver profile:', error);
    }
}



function updateUIWithDriverData(driver) {
    // Update Sidebar
    const name = driver.fullName || 'Driver';
    document.getElementById('sidebarName').textContent = name;
    if (driver.profilePic) {
        document.getElementById('sidebarProfilePic').src = driver.profilePic;
    }
}

function switchTab(tab) {
    const assignedView = document.getElementById('view-assigned');
    const assignedTab = document.getElementById('tab-assigned');
    const detailsView = document.getElementById('view-details');
    const detailsTab = document.getElementById('tab-details');

    // Hide all views first
    assignedView.classList.add('hidden');
    detailsView.classList.add('hidden');

    // Reset tab styles
    assignedTab.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all text-gray-600 hover:bg-gray-50';
    detailsTab.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all text-gray-600 hover:bg-gray-50';

    if (tab === 'assigned') {
        assignedView.classList.remove('hidden');
        assignedTab.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all text-brand-700 bg-brand-50 shadow-sm border border-brand-100';
        loadAssignedDeliveries();
    } else if (tab === 'details') {
        detailsView.classList.remove('hidden');
        detailsTab.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all text-brand-700 bg-brand-50 shadow-sm border border-brand-100';
        loadMyDetails();
    }
}

async function loadAssignedDeliveries() {
    const container = document.getElementById('deliveries-container');
    container.innerHTML = '<div class="text-center animate-pulse">Loading assignments...</div>';

    try {
        if (!currentDriver || !currentDriver.id) {
            console.error('Driver ID not found');
            return;
        }
        const response = await driverService.getAssignedDeliveries(currentDriver.id);
        if (response.success && response.data && response.data.length > 0) {
            // Driver is assigned
            renderViewAddressesButton(response.data);
        } else {
            // Not assigned
            const tmpl = document.getElementById('tmpl-not-assigned');
            container.innerHTML = '';
            container.appendChild(tmpl.content.cloneNode(true));
        }
    } catch (error) {
        console.error('Error loading deliveries:', error);
        container.innerHTML = '<div class="text-red-500">Failed to load deliveries. Please try again.</div>';
    }
}

function renderViewAddressesButton(deliveries) {
    const container = document.getElementById('deliveries-container');
    const tmpl = document.getElementById('tmpl-view-addresses-btn');
    container.innerHTML = '';
    const content = tmpl.content.cloneNode(true);

    // Attach event listener to the button
    const btn = content.querySelector('button');
    btn.onclick = () => renderDeliveriesList(deliveries);

    container.appendChild(content);
}

function renderDeliveriesList(deliveries) {
    const container = document.getElementById('deliveries-container');
    container.className = "bg-transparent shadow-none border-none w-full"; // Adjust container for list

    const tmplList = document.getElementById('tmpl-deliveries-list');
    container.innerHTML = '';
    const listContent = tmplList.content.cloneNode(true);
    const listContainer = listContent.getElementById('deliveries-list-container');

    deliveries.forEach(delivery => {
        const tmplCard = document.getElementById('tmpl-delivery-card');
        const card = tmplCard.content.cloneNode(true);

        card.querySelector('.order-id').textContent = delivery.orderId;
        card.querySelector('.customer-name').textContent = delivery.username;
        card.querySelector('.customer-phone').textContent = delivery.phoneNumber;

        // Compose address from landmark, place, district
        const fullAddress = [delivery.landmark, delivery.place, delivery.district]
            .filter(Boolean)
            .join(', ');
        card.querySelector('.customer-address').textContent = fullAddress || 'N/A';

        const startBtn = card.querySelector('.btn-start');
        const completeBtn = card.querySelector('.btn-complete');
        const mapWrapper = card.querySelector('.map-wrapper');
        const mapDiv = mapWrapper.querySelector('div');

        // Dynamic ID for map container
        const mapId = `map-${delivery.orderId}`;
        mapDiv.id = mapId;

        if (delivery.isCompleted) {
            startBtn.classList.add('hidden');
            completeBtn.classList.remove('hidden');
            completeBtn.disabled = true;
            completeBtn.textContent = "Completed";
            completeBtn.className = 'flex-1 bg-gray-400 text-white font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2';

            const badge = card.querySelector('.status-badge');
            if (badge) {
                badge.className = 'px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold';
                badge.textContent = 'Delivered';
            }
        }

        startBtn.onclick = async () => {
            try {
                const res = await driverService.startDelivery(delivery.username);
                if (res.success) {
                    startBtn.classList.add('hidden');
                    completeBtn.classList.remove('hidden');
                    mapWrapper.classList.remove('hidden');
                    initMap(mapId, delivery);
                }
            } catch (err) {
                console.error("Error starting delivery:", err);
            }
        };

        completeBtn.onclick = async () => {
            try {
                const res = await driverService.completeDelivery(delivery.orderId, delivery.username);
                if (res.success) {
                    completeBtn.classList.add('hidden');
                    mapWrapper.classList.add('hidden');
                    // Refresh the list or update status
                    delivery.isCompleted = true;
                    renderDeliveriesList(deliveries);



                    // Cleanup map instance
                    if (activeMaps[delivery.orderId]) {
                        activeMaps[delivery.orderId].remove();
                        delete activeMaps[delivery.orderId];
                    }
                }
            } catch (err) {
                console.error("Error completing delivery:", err);
            }
        };

        listContainer.appendChild(card);
    });

    container.appendChild(listContent);
}

function loadMyDetails() {
    const container = document.getElementById('details-container');
    if (!currentDriver) {
        container.innerHTML = '<div class="text-red-500">Failed to load details. Please refresh.</div>';
        return;
    }

    const tmpl = document.getElementById('tmpl-driver-details');
    container.innerHTML = '';
    const content = tmpl.content.cloneNode(true);

    // Populate registration details from the data structure
    const statusEl = content.getElementById('detail-verified');
    statusEl.textContent = currentDriver.verified || 'PENDING';

    // Status styling
    if (currentDriver.verified === 'VERIFIED') {
        statusEl.className = 'px-4 py-1.5 rounded-full text-sm font-bold shadow-sm bg-green-100 text-green-700';
    } else {
        statusEl.className = 'px-4 py-1.5 rounded-full text-sm font-bold shadow-sm bg-yellow-100 text-yellow-700';
    }

    content.getElementById('detail-licenseNumber').textContent = currentDriver.licenseNumber || 'N/A';
    content.getElementById('detail-licenseExpiry').textContent = currentDriver.licenseExpiry || 'N/A';
    content.getElementById('detail-vehicleNumber').textContent = currentDriver.vehicleNumber || 'N/A';

    // Format dates
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    content.getElementById('detail-submittedAt').textContent = formatDate(currentDriver.submittedAt);
    content.getElementById('detail-verifiedAt').textContent = formatDate(currentDriver.verifiedAt);

    // Document link - updated to use the image modal
    const licenseLink = content.getElementById('detail-licenseUrl');
    if (currentDriver.licenseUrl) {
        licenseLink.href = 'javascript:void(0)';
        licenseLink.onclick = () => openLicenseImageModal(currentDriver.licenseUrl);
        licenseLink.classList.remove('hidden');
    } else {
        licenseLink.classList.add('hidden');
    }

    container.appendChild(content);
}

function openLicenseImageModal(url) {
    const modal = document.getElementById('licenseImageModal');
    const img = document.getElementById('licenseDisplayImg');
    if (url) {
        img.src = url;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeLicenseImageModal() {
    const modal = document.getElementById('licenseImageModal');
    const img = document.getElementById('licenseDisplayImg');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    img.src = '';
}

function initMap(mapId, delivery) {
    // Check if map already exists
    if (activeMaps[delivery.orderId]) {
        return;
    }

    // Default location if geoloc fails (Kathmandu)
    const defaultLat = 27.7172;
    const defaultLng = 85.3240;

    const map = L.map(mapId).setView([defaultLat, defaultLng], 13);
    activeMaps[delivery.orderId] = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            // Target coordinates from delivery (Assuming they are provided in the data)
            // If not provided, we might need to geocode the address
            const targetLat = delivery.latitude || defaultLat;
            const targetLng = delivery.longitude || defaultLng;

            // Add Routing
            const routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(userLat, userLng),
                    L.latLng(targetLat, targetLng)
                ],
                routeWhileDragging: false,
                lineOptions: {
                    styles: [{ color: '#10b981', weight: 6 }] // Brand green
                },
                createMarker: function () { return null; } // Don't create default markers
            }).addTo(map);

            // Add Custom Markers
            L.marker([userLat, userLng]).addTo(map).bindPopup('Your Location').openPopup();

            // Compose address for popup
            const fullAddress = [delivery.landmark, delivery.place, delivery.district]
                .filter(Boolean)
                .join(', ') || 'N/A';
            L.marker([targetLat, targetLng]).addTo(map).bindPopup(`Delivery: ${fullAddress}`);

            currentRoutingControls[delivery.orderId] = routingControl;

        }, (error) => {
            console.warn('Geolocation failed:', error);
            // Just show target marker if geo fails
            const targetLat = delivery.latitude || defaultLat;
            const targetLng = delivery.longitude || defaultLng;

            const fullAddress = [delivery.landmark, delivery.place, delivery.district]
                .filter(Boolean)
                .join(', ') || 'N/A';
            L.marker([targetLat, targetLng]).addTo(map).bindPopup(`Delivery: ${fullAddress}`).openPopup();
        });
    }
}
