// State Initialization
// Prevent map updates from overwriting user input fields on this page
window.updateAddressFields = function () { console.log("Automatic address field update disabled on this page."); };

let state = {
    profile: null,
    addresses: {
        home: null,
        work: null
    },
    orders: [],
    driverStatus: null,
    isLoading: false
};


function showToast(message, type = "info", duration = 3000) {
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

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const eye = button.querySelector('svg:nth-child(1)');      // Eye (show)
    const eyeSlash = button.querySelector('svg:nth-child(2)'); // Eye-slash (hide)

    if (input.type === 'password') {
        input.type = 'text';
        eye.classList.add('hidden');
        eyeSlash.classList.remove('hidden');
    } else {
        input.type = 'password';
        eye.classList.remove('hidden');
        eyeSlash.classList.add('hidden');
    }
}

// Update Navbar UI
function updateAuthUI(isLoggedIn) {
    const authBtn = document.getElementById('loginBtn');
    const profileWrapper = document.getElementById('profileWrapper');

    if (!authBtn || !profileWrapper) return;

    if (isLoggedIn) {
        // Hide login button
        authBtn.classList.add('hidden');

        // Show profile icon
        profileWrapper.classList.remove('hidden');
    } else {
        // Show login button
        authBtn.classList.remove('hidden');

        // Hide profile icon
        profileWrapper.classList.add('hidden');
    }
}


//state update functions
function updateProfileUI() {
    if (!state.profile) return;

    const fullNameEl = document.getElementById('fullName');
    const userEmailEl = document.getElementById('userEmail');
    const profilePicEl = document.getElementById('profilePic');
    const userNameEl = document.getElementById('userName');


    if (fullNameEl) fullNameEl.textContent = state.profile.fullName || 'User';
    if (userEmailEl) userEmailEl.textContent = state.profile.email || '';
    if (userNameEl) userNameEl.textContent = state.profile.username ? `Username: ${state.profile.username}` : 'Username';

    if (profilePicEl && state.profile.profileUrl) {
        profilePicEl.src = state.profile.profileUrl;
    }
}

function updateAddressUI() {
    updateSingleAddress('home', state.addresses.home);
    updateSingleAddress('work', state.addresses.work);
}
function updateSingleAddress(type, address) {
    const addressContainer = document.getElementById(`${type}Address`);

    if (!address) {
        addressContainer.innerHTML = `
        <div class="text-center py-12">
            <svg class="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p class="text-slate-500 font-medium">No ${type} address added yet</p>
            <button onclick="openAddressModal('${type}')" 
                class="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                + Add ${type.charAt(0).toUpperCase() + type.slice(1)} Address
            </button>
        </div>
        `;
    } else {
        addressContainer.innerHTML = `
            <div class="bg-slate-50 rounded-2xl p-6">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="font-bold text-slate-800 text-lg">${type.charAt(0).toUpperCase() + type.slice(1)} Address</h4>
                    <button onclick="editAddress('${type}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Update
                    </button>
                </div>
                <p class="text-slate-600 mb-2">${address.province}, ${address.district}</p>
                <p class="text-slate-600 mb-2">${address.place}, ${address.landmark}</p>
                ${address.phone ? `<p class="text-slate-500 text-sm">Phone: ${address.phone}</p>` : ''}
            </div>
        `;
    }
}

function updateOrdersUI() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;

    if (state.orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg class="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p class="text-slate-500 font-medium">No orders yet</p>
            </div>
        `;
        return;
    }

    ordersContainer.innerHTML = state.orders.map(order => createOrderCard(order)).join('');
}
function createOrderCard(order) {
    const statusColors = {
        confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
        shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
        delivered: { bg: 'bg-green-100', text: 'text-green-700' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    const status = order.status.toLowerCase();
    const statusColor = statusColors[status] || statusColors.pending;

    const emoji = status === 'delivered' ? '✅' : status === 'shipped' ? '📦' : '👕';

    return `
        <div class="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <span class="absolute top-4 right-4 ${statusColor.bg} ${statusColor.text} px-4 py-2 rounded-full text-sm font-medium shadow-sm z-10">
                ${order.status}
            </span>
            <div class="bg-gradient-to-br from-blue-100 to-indigo-100 h-32 flex items-center justify-center">
                <span class="text-6xl">${emoji}</span>
            </div>
            <div class="p-6">
                <h4 class="font-bold text-slate-800 text-lg mb-1">#${order.orderId}</h4>
                <p class="text-sm text-slate-500 mb-3">${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="font-bold text-blue-600 text-xl">Rs. ${order.totalAmount.toFixed(2)}</span>
                </div>
                 <button onclick="viewOrderDetails('${order.orderId}')"
                    class="w-full mb-4 bg-slate-700 text-white py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
                    View Details
                </button>
                ${getOrderActionButton(order)}

            </div>
        </div>
    `;
}
function getOrderActionButton(order) {
    const status = order.status.toLowerCase();

    if (status === 'confirmed') {
        return `
        <button onclick = "cancelOrder('${order.orderId}')"
        class="w-full bg-red-600 text-white py-2 rounded-full text-sm font-medium hover:bg-red-700 transition-colors" >
            Cancel Order
        </button>
        `;
    } else if (status === 'shipped') {
        return `
            <button onclick="trackOrder('${order.orderId}')"
                class="w-full bg-blue-600 text-white py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                Track Order
            </button>
        `;
    }
    return '';
}

//data fetching functions
async function fetchProfile() {
    try {
        state.isLoading = true;
        const response = await profileService.getProfileDetails();

        if (response?.success) {
            state.profile = response.data;
            updateProfileUI();
        } else {
            showToast('Failed to load profile', "error");
        }

    } catch (error) {
        console.error("Error fetching profile", error);
        showToast("Network Error in loading profile", "error");
    }
    finally {
        state.isLoading = false;
    }
}
async function fetchAddresses() {
    try {
        const homeResponse = await profileService.getAddressType('HOME');
        const workResponse = await profileService.getAddressType('WORK');

        if (homeResponse?.success) {
            state.addresses.home = homeResponse.data;
        }
        if (workResponse?.success) {
            state.addresses.work = workResponse.data;
        }

        updateAddressUI();
    } catch (error) {
        console.error("Error in fetching address", error);
        showToast('Error loading addresses', "error");
    }
}
async function fetchOrders() {
    try {
        const response = await profileService.getOrderForProfile();
        if (response?.success) {
            state.orders = response.data || [];
            updateOrdersUI(); // <--- This was missing
        } else {
            showToast("Failed to load orders", "error");
        }
    } catch (error) {
        console.error("Error in fetching in orders", error);
        showToast("Failed to fetch orders", "error");
    }
}

//left to update the ui for this
async function checkDriverStatus() {
    try {
        const response = await profileService.checkDriverStatus();

        if (response?.success) {
            state.driverStatus = response.data;
            //updateDriverStatusUI()
        }
    } catch (error) {
        console.error("Error in checking driverf status", error);
    }
}


//tab switching function
function switchAddressTab(tab) {
    const homeTab = document.getElementById('homeTab');
    const workTab = document.getElementById('workTab');
    const homeAddress = document.getElementById('homeAddress');
    const workAddress = document.getElementById('workAddress');

    if (tab === 'home') {
        homeTab.classList.remove('tab-inactive');
        homeTab.classList.add('tab-active');
        workTab.classList.add('tab-inactive');
        homeAddress.classList.remove('hidden');
        workAddress.classList.add('hidden');
    } else {
        workTab.classList.remove('tab-inactive');
        workTab.classList.add('tab-active');
        homeTab.classList.remove('tab-active');
        homeTab.classList.add('tab-inactive');
        workAddress.classList.remove('hidden');
        homeAddress.classList.add('hidden');
    }
}





//modal functions for the the profile picturees and other password modals

function openEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

function openPasswordModal() {
    document.getElementById('passwordModal').classList.remove('hidden');
    document.getElementById('passwordModal').classList.add('flex');

    // Clear form fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}


function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('flex');
    document.getElementById('passwordModal').classList.add('hidden');
}

function openAddressModal(type = 'home') {
    document.getElementById('addressType').value = type;
    document.getElementById('addressModal').classList.remove('hidden');
    document.getElementById('addressModal').classList.add('flex');

    // Try to find the save button
    const saveBtn = document.getElementById('saveButton');

    if (!saveBtn) {
        console.error("Save/Update button not found in address modal");
        return;
    }

    // Pre-fill if editing existing address
    const addr = state.addresses[type.toLowerCase()];
    if (addr) {
        document.getElementById('province').value = addr.province || '';
        document.getElementById('district').value = addr.district || '';
        document.getElementById('place').value = addr.place || '';
        document.getElementById('landmark').value = addr.landmark || '';

        // Update coordinates and map
        if (addr.latitude && addr.longitude) {
            updateLatLng(addr.latitude, addr.longitude);
            if (typeof updateMapFromLatAndLng === 'function') {
                updateMapFromLatAndLng(addr.latitude, addr.longitude);
            }
        }

        // Switch button to Update mode
        saveBtn.onclick = updateAddress;
        saveBtn.textContent = 'Update Address';

        // Leaflet fix: invalidate size when modal opens
        setTimeout(() => { if (window.map) window.map.invalidateSize(); }, 100);
    } else {
        // Clear form fields
        ['province', 'district', 'place', 'landmark', 'latitude', 'longitude'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Switch button to Save mode
        saveBtn.onclick = saveAddress;
        saveBtn.textContent = 'Save Address';
    }
}
function closeAddressModal() {
    document.getElementById('addressModal').classList.add('hidden');
    document.getElementById('addressModal').classList.remove('flex');

    // Clear form fields
    ['province', 'district', 'place', 'landmark'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    })
}
function openLicenseModal() {
    document.getElementById('licenseModal').classList.remove('hidden');
    document.getElementById('licenseModal').classList.add('flex');
    //set current timestamp for submitted at
}
function closeLicenseModal() {
    document.getElementById('licenseModal').classList.add('hidden');
    document.getElementById('licenseModal').classList.remove('flex');
    //reset the form
    document.getElementById('licenseModal').querySelectorAll('input,select').forEach(input => input.value = '');
    document.getElementById('licensePreview').classList.add('hidden');


}

//profile picture
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    //simle validation
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
    }

    //priview and upload
    const formData = new FormData();
    formData.append('file', file);

    uploadProfilePhoto(formData);
}
async function uploadProfilePhoto(formData) {
    try {
        showToast('Upoloading photo....', 'info');

        const response = await profileService.changePhoto(formData);

        if (response?.success) {
            state.profile.profileUrl = response.data.profileUrl || response.data;
            updateProfileUI();
            showToast('Profile photo updated successfully', 'success');
        } else {
            showToast('Failed to upload photo', 'error');
        }
    } catch (error) {
        console.error('Error uploading photo', error);
        showToast('Error in uploading photo', 'error');
    }
}


//change password function
async function changePassword() {
    const oldPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const reNewPassword = document.getElementById('confirmPassword').value;

    if (!oldPassword || !newPassword || !reNewPassword) {
        showToast("Please fill all the fields", "info");
        return;
    }

    if (!validatePassword(newPassword)) {
        return;
    }

    if (newPassword !== reNewPassword) {
        showToast("Passwords do not match", "error");
        return;
    }
    if (newPass.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    try {
        const response = await profileService.changePassword({
            "oldPassword": oldPassword,
            "newPassword": newPassword,
            "reNewPassword": reNewPassword
        });

        if (response?.success) {
            closePasswordModal();
            showToast("Password updated successfully", "success");
        } else {

            const msg = response?.message || response?.errorCode || "Failed to update password";
            showToast(msg, "error");
        }
    } catch (error) {
        console.error("Error changing password:", error);
        showToast("Network error. Please try again.", "error");
    }
}

//save address function
async function saveAddress() {
    const type = document.getElementById('addressType').value.toUpperCase();
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;
    const place = document.getElementById('place').value;
    const landmark = document.getElementById('landmark').value;


    if (!province || !district || !place) {
        showToast("Pleae fill all the fields", "info");
        return;
    }

    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    const addressData = {
        type,
        province,
        district,
        place,
        landmark,
        latitude,
        longitude
    };

    try {
        const response = await profileService.addAddress(addressData);
        if (response?.success) {
            state.addresses[type.toLowerCase()] = response.data;
            updateAddressUI();
            closeAddressModal();
            showToast("Address saved successfully", "success");
        } else {
            const msg = response?.message || "Failed to save address";
            showToast(msg, "error");
        }
    } catch (error) {
        console.error("Error saving address", error);
        showToast("Network error", "error");
    }

}
async function updateAddress() {
    const type = document.getElementById('addressType').value.toUpperCase();
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;
    const place = document.getElementById('place').value;
    const landmark = document.getElementById('landmark').value;

    if (!province || !district || !place) {
        showToast("Pleae fill all the fields");
        return;
    }

    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    const addressData = {
        province,
        district,
        place,
        landmark,
        latitude,
        longitude
    };
    try {
        const currentAddr = state.addresses[type.toLowerCase()];
        if (!currentAddr) {
            showToast("Original address not found", "error");
            return;
        }
        const response = await profileService.updateAddress(currentAddr.id, addressData);
        if (response?.success) {
            state.addresses[type.toLowerCase()] = response.data;
            updateAddressUI();
            closeAddressModal();
            showToast("Address updated successfully", "success");
        } else {
            const msg = response?.message || "Failed to update address";
            showToast(msg, "error");
        }
    } catch (error) {
        console.error("Error updating address", error);
        showToast("Network error", "error");
    }

}

function editAddress(type) {
    openAddressModal(type);
}


//locate on map function
// ===== LOCATE BUTTON =====
const locateBtn = document.getElementById("locateMapBtn");
const provinceInput = document.getElementById("province");
const districtInput = document.getElementById("district");
const placeInput = document.getElementById("place");
const landmarkInput = document.getElementById("landmark");

if (locateBtn) {
    locateBtn.addEventListener("click", async () => {
        const province = provinceInput.value?.trim();
        const district = districtInput.value?.trim();
        const place = placeInput.value?.trim();
        const landmark = landmarkInput.value?.trim();

        if (!province && !district && !place && !landmark) {
            showToast("Please fill the address field");
            return;
        }

        const address = [landmark, place, district, province, COUNTRY]
            .filter(Boolean)
            .join(", ");

        const location = await geocodeAddress(address);
        if (!location) {
            showToast("Location not found", "error");
            return;
        }

        map.setView([location.lat, location.lng], 16);
        marker.setLatLng([location.lat, location.lng]);

        updateLatLng(location.lat, location.lng);
        // updateAddressFields(location.components, location.roadInfo); // Disabled to prevent overwriting user input
    });
}



//Order functions
function viewAllOrders() {
    //todo: navigate to allOrder page
    showToast("Going to order details", "info");
    window.location.href = '/orders.html';
}


async function cancelOrder(orderId) {
    if (confirm(`Are you sure you want to cancel order  # ${orderId}?`)) {
        try {
            showToast("Cancelling order...", "info");
            const response = await profileService.cancelOrder(orderId);
            if (response.success) {

                // Find the specific order and update its status
                const orderIndex = state.orders.findIndex(o => o.orderId == orderId);
                if (orderIndex !== -1) {
                    state.orders[orderIndex].status = 'CANCELLED';
                }
                showToast(response.message || "Cancelled successfully", "success");
            } else {
                showToast("Failed to cancel order", "error");

            }
            updateOrdersUI();

        } catch (error) {
            console.error("Error canceling order", error);
            showToast("Error in canceling order", "error");
            updateOrdersUI();
        }
    }
}

async function viewOrderDetails(orderId) {
    try {
        //loading state

        showToast("Fetching order details...", "success");
        const response = await profileService.getSpecificOrderDetail(orderId);

        if (response?.success) {
            populateOrderDetailModal(response.data);
            openOrderDetailModal();
        } else {
            showToast("Failed to load order details", "error");
        }


    } catch (error) {
        console.error("Error while fetching", error);
        showToast("Network error while fetching order details", "error");
    }
}

function trackOrder(orderId) {
    window.location.href = `/track-order.html?orderId=${orderId}`;
}


// Modal Control Functions
function openOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}
function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = ''; // Restore scrolling
    }
}
// Populate Modal Data
function populateOrderDetailModal(order) {
    // 1. Header Info
    document.getElementById('popupOrderId').textContent = order.orderId;
    document.getElementById('popupDate').textContent = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    // Status Styles
    const statusEl = document.getElementById('popupStatus');
    const statusBg = document.getElementById('popupStatusBg');
    statusEl.textContent = order.status;
    // Reset classes
    statusBg.className = 'p-3 rounded-full bg-blue-50 text-blue-600'; // default
    // Apply specific color based on status
    const s = order.status.toLowerCase();
    if (s === 'delivered') statusBg.className = 'p-3 rounded-full bg-green-100 text-green-600';
    else if (s === 'cancelled') statusBg.className = 'p-3 rounded-full bg-red-100 text-red-600';
    else if (s === 'shipped') statusBg.className = 'p-3 rounded-full bg-indigo-100 text-indigo-600';
    // 2. Order Items
    const itemsContainer = document.getElementById('popupItemsContainer');
    itemsContainer.innerHTML = order.orderItems.map(item => `
        <div class="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl px-2 transition-colors">
            <div class="h-16 w-16 bg-white rounded-lg border border-slate-100 flex-shrink-0 overflow-hidden">
                <img src="${item.product.imageUrl || '/assets/images/placeholder.png'}" 
                     alt="${item.product.title}" 
                     class="h-full w-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h5 class="font-semibold text-slate-800 truncate">${item.product.title}</h5>
                <p class="text-xs text-slate-500 line-clamp-1">${item.product.shortDescription || ''}</p>
            </div>
            <div class="text-right">
                <p class="font-medium text-slate-800">Rs. ${item.price.toFixed(2)}</p>
                <p class="text-xs text-slate-500">Qty: ${item.quantity}</p>
            </div>
        </div>
    `).join('');
    // 3. Shipping Address
    const addr = order.address;
    const addressEl = document.getElementById('popupAddress');
    if (addr) {
        addressEl.innerHTML = `
            <p class="font-medium text-slate-800">${state.profile.fullName || 'User'}</p>
            <p>${addr.place}, ${addr.landmark || ''}</p>
            <p>${addr.district}, ${addr.province}</p>
            <p class="mt-2 flex items-center gap-2 text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                ${order.phoneNumber || addr.phone || 'N/A'}
            </p>
        `;
    } else {
        addressEl.innerHTML = '<p class="text-slate-400">Address info not available</p>';
    }
    // 4. Payment & Total
    document.getElementById('popupTotal').textContent = 'Rs. ' + order.totalAmount.toFixed(2);
    // Handle payment details
    const pay = order.payment;
    if (pay) {
        document.getElementById('popupPaymentMethod').textContent = pay.paymentMethod || 'Online Payment';
        document.getElementById('popupPaymentStatus').textContent = pay.paymentStatus || 'Paid';
    } else {
        document.getElementById('popupPaymentMethod').textContent = 'Pay on Delivery'; // Fallback
        document.getElementById('popupPaymentStatus').textContent = 'Pending';
    }
}



//driver application
async function saveLicense() {
    const licenseNumber = document.getElementById('licenseNumber').value;
    const licenseExpiry = document.getElementById('licenseExpiry').value;
    const vehicleNumber = document.getElementById('vehicleNumber').value;
    const licenseFile = document.getElementById('licenseFile').files[0];

    if (!licenseNumber || !licenseExpiry || !vehicleNumber || !licenseFile) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    const driverRegisterRequest = {
        "licenseNumber": licenseNumber,
        "licenseExpiry": licenseExpiry,
        "vehicleNumber": vehicleNumber
    };
    const formData = new FormData();
    // Append JSON part as a Blob with application/json type
    formData.append('driverRegisterRequest', new Blob([JSON.stringify(driverRegisterRequest)], {
        type: 'application/json'
    }));
    formData.append('license', licenseFile);

    try {
        const response = await profileService.registerDriver(formData);

        if (response?.success) {
            closeLicenseModal();
            showToast('Driver application submitted successfully! We will review it soon.', 'success');
            await checkDriverStatus();
        } else {
            showToast("Failed to submit application", "error");
        }
    } catch (error) {
        console.error("Error submitting driver application");
        showToast("Error submitting application", "error");
    }
}
document.addEventListener('DOMContentLoaded', function () {
    const licenseFileInput = document.getElementById('licenseFile');
    if (licenseFileInput) {
        licenseFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const preview = document.getElementById('licensePreview');
            const imagePreview = document.getElementById('licenseImagePreview');
            const fileName = document.getElementById('licenseFileName');

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
            fileName.textContent = file.name;
            preview.classList.remove('hidden');
        });
    }
});




//logout function  use the previous function
async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {

        try {
            const response = await AuthService.logout();

            if (response?.success) {
                updateAuthUI(false);
                showToast("Logging out...", "success");

                setTimeout(() => window.location.href = '/auth/login.html', 1000);
            } else {
                showToast("Failed to logout", "error");
            }
        } catch (error) {
            console.error("Network error failed to logout", error);
            showToast("Network Error", "error");
        }
    }
}


// PAGE LOAD INITIALIZATION
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Profile page loaded');

    // Show loading state
    state.isLoading = true;

    // Fetch all data in parallel
    await Promise.all([
        fetchProfile(),
        fetchAddresses(),
        fetchOrders(),
        checkDriverStatus()
    ]);

    state.isLoading = false;
});





