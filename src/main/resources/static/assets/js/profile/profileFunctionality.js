// State Management
let state = {
    profile: null,
    addresses: { home: null, work: null },
    orders: [],
    appointments: [],
    isLoading: false,
    cartCount: 0
};

// Prevent map updates from overwriting user input fields on this page
window.updateAddressFields = function () {
    console.log("Automatic address field update disabled on this page to preserve manual input.");
};


document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Profile Page...');
    state.isLoading = true;

    try {
        await Promise.all([
            fetchProfile(),
            fetchAddresses(),
            fetchOrders(),
            fetchAppointments(),
            checkDriverStatus(),
            updateCartCount()
        ]);
    } catch (error) {
        console.error("Error during initialization:", error);
    } finally {
        state.isLoading = false;
    }
});

// ==========================================
// 2. DATA FETCHING
// ==========================================

async function fetchProfile() {
    try {
        const res = await profileService.getProfileDetails();
        if (res?.success) {
            state.profile = res.data;
            renderProfile();
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        showToast("Failed to load profile", "error");
    }
}

async function fetchAddresses() {
    try {
        const [homeRes, workRes] = await Promise.all([
            profileService.getAddressType('HOME'),
            profileService.getAddressType('WORK')
        ]);

        if (homeRes?.success) state.addresses.home = homeRes.data;
        if (workRes?.success) state.addresses.work = workRes.data;

        renderAddresses();
    } catch (error) {
        console.error("Error fetching addresses:", error);
    }
}

async function fetchOrders() {
    try {
        const res = await profileService.getOrderForProfile();
        if (res?.success) {
            state.orders = res.data || [];
            renderOrders();
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
}

async function fetchAppointments() {
    try {
        const res = await profileService.getAppointmentForProfile();
        if (res?.success) {
            state.appointments = res.data || [];
            renderAppointments();
        }
    } catch (error) {
        console.error("Error fetching appointments:", error);
    }
}

async function updateCartCount() {
    try {
        const res = await profileService.getCartCount();
        if (res?.success) {
            state.cartCount = res.data.totalCartItems;
            const el = document.getElementById('cartCount');
            if (el) el.textContent = state.cartCount;
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
    }
}

async function checkDriverStatus() {
    try {
        const res = await profileService.checkDriverStatus();
        const btns = {
            verified: document.getElementById('driverDashboardBtn'),
            pending: document.getElementById('driverPendingBtn'),
            apply: document.getElementById('applyDriverBtn')
        };

        // Reset visibility
        Object.values(btns).forEach(btn => btn?.classList.add('hidden'));

        if (res.success && res.data) {
            if (res.data === 'VERIFIED') btns.verified?.classList.remove('hidden');
            else if (res.data === 'PENDING') btns.pending?.classList.remove('hidden');
            else btns.apply?.classList.remove('hidden');
        } else {
            btns.apply?.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error checking driver status:", error);
    }
}

// ==========================================
// 3. UI RENDERING
// ==========================================

function renderProfile() {
    if (!state.profile) return;
    const { fullName, email, username, profileUrl } = state.profile;

    const elements = {
        fullName: document.getElementById('fullName'),
        email: document.getElementById('userEmail'),
        username: document.getElementById('userName'),
        pic: document.getElementById('profilePic')
    };

    if (elements.fullName) elements.fullName.textContent = fullName || 'User';
    if (elements.email) elements.email.textContent = email || '';
    if (elements.username) elements.username.textContent = username ? `Username: ${username}` : '';
    if (elements.pic && profileUrl) elements.pic.src = profileUrl;
}

function renderAddresses() {
    ['home', 'work'].forEach(type => {
        const container = document.getElementById(`${type}Address`);
        if (!container) return;

        const addr = state.addresses[type];
        if (!addr) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <svg class="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p class="text-slate-500 font-medium">No ${type} address added yet</p>
                    <button onclick="openAddressModal('${type}')" class="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                        + Add ${type.charAt(0).toUpperCase() + type.slice(1)} Address
                    </button>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="bg-slate-50 rounded-2xl p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="font-bold text-slate-800 text-lg">${type.charAt(0).toUpperCase() + type.slice(1)} Address</h4>
                        <button onclick="editAddress('${type}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Update
                        </button>
                    </div>
                    <p class="text-slate-600 mb-2">${addr.province}, ${addr.district}</p>
                    <p class="text-slate-600 mb-2">${addr.place}, ${addr.landmark}</p>
                    ${addr.phone ? `<p class="text-slate-500 text-sm">Phone: ${addr.phone}</p>` : ''}
                </div>`;
        }
    });
}

function renderOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (state.orders.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg class="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <p class="text-slate-500 font-medium">No orders yet</p>
                <a href="product.html" class="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">Order Now</a>
            </div>`;
        return;
    }

    container.innerHTML = state.orders.map(order => createOrderCard(order)).join('');
}

function renderAppointments() {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;

    if (state.appointments.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg class="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-slate-500 font-medium">No appointments yet</p>
                <a href="service.html" class="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">Book Service Now</a>
            </div>`;
        return;
    }

    container.innerHTML = state.appointments.map(apt => createAppointmentCard(apt)).join('');
}

// ==========================================
// 4. COMPONENT CREATORS
// ==========================================

function createOrderCard(order) {
    const status = order.status.toLowerCase();
    const style = getStatusStyle(status);
    const emoji = status === 'delivered' ? '✅' : status === 'shipped' ? '📦' : '👕';
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
        <div class="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <span class="absolute top-4 right-4 ${style.bgClass} ${style.textClass} px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10">${order.status}</span>
            <div class="bg-gradient-to-br from-blue-100 to-indigo-100 h-32 flex items-center justify-center">
                <span class="text-6xl">${emoji}</span>
            </div>
            <div class="p-6">
                <h4 class="font-bold text-slate-800 text-lg mb-1">#${order.orderId}</h4>
                <p class="text-xs text-slate-500 mb-3">${date}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="font-bold text-blue-600 text-xl">Rs. ${order.totalAmount.toFixed(2)}</span>
                </div>
                <button onclick="viewOrderDetails('${order.orderId}')" class="w-full mb-3 bg-slate-800 text-white py-2 rounded-full text-xs font-bold uppercase hover:bg-slate-900 transition-colors">
                    View Details
                </button>
                ${getOrderActionButton(order)}
            </div>
        </div>`;
}

function getOrderActionButton(order) {
    const status = order.status.toLowerCase();
    if (status === 'confirmed') {
        return `<button onclick="cancelOrder('${order.orderId}')" class="w-full bg-red-600 text-white py-2 rounded-full text-xs font-bold uppercase hover:bg-red-700 transition-colors">Cancel Order</button>`;
    } else if (status === 'shipped') {
        return `<button onclick="trackOrder('${order.orderId}')" class="w-full bg-blue-600 text-white py-2 rounded-full text-xs font-bold uppercase hover:bg-blue-700 transition-colors">Track Order</button>`;
    }
    return '';
}

function createAppointmentCard(apt) {
    const status = apt.status.toLowerCase();
    const style = getAppointmentStatusStyle(status);
    const serviceName = apt.serviceResponse?.name || 'Service';
    const totalAmount = apt.totalAmount || 0;
    const date = new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
        <div class="relative bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <span class="absolute top-4 right-4 ${style.bgClass} ${style.textClass} px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm z-10">${apt.status}</span>
            <div class="bg-gradient-to-br from-indigo-100 to-blue-100 h-28 flex items-center justify-center">
                <span class="text-5xl">✂️</span>
            </div>
            <div class="p-6">
                <h4 class="font-bold text-slate-800 text-lg mb-1 truncate">${serviceName}</h4>
                <div class="flex flex-col gap-1 mb-4">
                    <p class="text-xs font-semibold text-slate-500 flex items-center gap-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        ${date}
                    </p>
                    <p class="text-[11px] font-bold text-indigo-600 flex items-center gap-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ${apt.startTime} - ${apt.endTime}
                    </p>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="font-bold text-indigo-600 text-lg">Rs. ${totalAmount.toFixed(2)}</span>
                </div>
                <button onclick="viewAppointmentDetails('${apt.appointmentId}')" class="w-full mb-3 bg-slate-800 text-white py-2 rounded-full text-xs font-bold uppercase hover:bg-slate-900 transition-colors">
                    View Info
                </button>
                ${getAppointmentActionButton(apt)}
            </div>
        </div>`;
}

function getAppointmentActionButton(apt) {
    const status = apt.status.toLowerCase();
    if (status !== 'booked' && status !== 'pending') return '';

    const now = new Date();
    const aptDate = new Date(apt.appointmentDate);
    const timeMatch = apt.startTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);

    if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const period = timeMatch[3];
        if (period?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        else if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
        aptDate.setHours(hours, mins, 0, 0);
    }

    if (aptDate.getTime() - now.getTime() > 30 * 60 * 1000) {
        return `<button onclick="cancelUserAppointment('${apt.appointmentId}')" class="w-full bg-red-50 text-red-600 border border-red-100 py-2 rounded-full text-xs font-bold uppercase hover:bg-red-100 transition-colors">Cancel</button>`;
    }
    return '';
}

// ==========================================
// 5. EVENT HANDLERS & ACTIONS
// ==========================================

async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    try {
        const res = await AuthService.logout();
        if (res?.success) {
            updateAuthUI(false);
            showToast("Logging out...", "success");
            setTimeout(() => window.location.href = '/auth/login.html', 1000);
        }
    } catch (error) {
        showToast("Logout failed. Please try again.", "error");
    }
}

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return showToast('Please select an image file', 'error');
    if (file.size > 5 * 1024 * 1024) return showToast('Image size should be less than 5MB', 'error');

    const formData = new FormData();
    formData.append('file', file);

    try {
        showToast('Uploading photo...', 'info');
        const res = await profileService.changePhoto(formData);
        if (res?.success) {
            state.profile.profileUrl = res.data.profileUrl || res.data;
            renderProfile();
            showToast('Photo updated successfully', 'success');
        }
    } catch (error) {
        showToast('Upload failed', 'error');
    }
}

async function changePassword() {
    const oldP = document.getElementById('currentPassword').value;
    const newP = document.getElementById('newPassword').value;
    const confP = document.getElementById('confirmPassword').value;
    const pattern = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@#$%^&+=!_*])(?=\S+$).{8,50}$/;

    if (!oldP || !newP || !confP) return showToast("Please fill all fields", "info");
    if (!newP.match(pattern)) return showToast("Password must be 8-50 characters with number, letter, and special character", "error");
    if (newP !== confP) return showToast("Passwords do not match", "error");

    showToast("Updating password...", "info");
    try {
        const res = await profileService.changePassword({ oldPassword: oldP, newPassword: newP, reNewPassword: confP });
        if (res?.success) {
            closePasswordModal();
            showToast("Password updated successfully", "success");
        } else {
            showToast(res?.message || "Update failed", "error");
        }
    } catch (error) {
        showToast("Network error", "error");
    }
}

// Address Actions
async function saveAddress() {
    const type = document.getElementById('addressType').value.toUpperCase();
    const data = getAddressFormData();
    if (!data.province || !data.district || !data.place) return showToast("Please fill all required fields", "info");

    showToast("Saving address...", "info");
    try {
        const res = await profileService.addAddress({ ...data, type });
        if (res?.success) {
            state.addresses[type.toLowerCase()] = res.data;
            renderAddresses();
            closeAddressModal();
            showToast("Address saved", "success");
        }
    } catch (error) {
        showToast("Failed to save address", "error");
    }
}

async function updateAddress() {
    const type = document.getElementById('addressType').value.toLowerCase();
    const data = getAddressFormData();
    const current = state.addresses[type];

    if (!current) return;

    showToast("Updating address...", "info");
    try {
        const res = await profileService.updateAddress(current.addressId || current.id, data);
        if (res?.success) {
            state.addresses[type] = res.data;
            renderAddresses();
            closeAddressModal();
            showToast("Address updated", "success");
        }
    } catch (error) {
        showToast("Update failed", "error");
    }
}

function getAddressFormData() {
    return {
        province: document.getElementById('province').value,
        district: document.getElementById('district').value,
        place: document.getElementById('place').value,
        landmark: document.getElementById('landmark').value,
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,
        type: document.getElementById('addressType').value.toUpperCase()
    };
}

// Order & Appointment Actions
async function cancelOrder(id) {
    if (!confirm(`Cancel order #${id}?`)) return;
    showToast("Cancelling order...", "info");
    try {
        const res = await profileService.cancelOrder(id);
        if (res.success) {
            const idx = state.orders.findIndex(o => o.orderId == id);
            if (idx !== -1) state.orders[idx].status = 'CANCELLED';
            renderOrders();
            showToast("Order cancelled", "success");
        }
    } catch (error) {
        showToast("Cancellation failed", "error");
    }
}

async function cancelUserAppointment(id) {
    if (!confirm(`Cancel appointment #${id}?`)) return;
    showToast("Cancelling appointment...", "info");
    try {
        const res = await profileService.cancelAppointment(id);
        if (res.success) {
            const apt = state.appointments.find(a => a.appointmentId == id);
            if (apt) apt.status = 'CANCELLED';
            renderAppointments();
            showToast("Appointment cancelled", "success");
        }
    } catch (error) {
        showToast("Cancellation failed", "error");
    }
}

async function viewOrderDetails(id) {
    try {
        showToast("Fetching details...", "info");
        const res = await profileService.getSpecificOrderDetail(id);
        if (res?.success) {
            populateOrderDetailModal(res.data);
            openOrderDetailModal();
        }
    } catch (error) {
        showToast("Failed to load details", "error");
    }
}

async function viewAppointmentDetails(id) {
    try {
        showToast("Fetching details...", "info");
        const res = await profileService.getSpecificAppointmentDetail(id);
        if (res?.success) {
            populateAppointmentDetailModal(res.data);
            openAppointmentDetailModal();
        }
    } catch (error) {
        showToast("Failed to load details", "error");
    }
}

function trackOrder(id) {
    window.location.href = `/track-order.html?orderId=${id}`;
}

// Driver Application
async function saveLicense() {

    const fields = {
        num: document.getElementById('licenseNumber').value,
        expiry: document.getElementById('licenseExpiry').value,
        veh: document.getElementById('vehicleNumber').value,
        file: document.getElementById('licenseFile').files[0]
    };

    if (!fields.num || !fields.expiry || !fields.veh || !fields.file) return showToast('Fill all fields', 'error');

    const formData = new FormData();
    formData.append('driverRegisterRequest', new Blob([JSON.stringify({
        licenseNumber: fields.num,
        licenseExpiry: fields.expiry,
        vehicleNumber: fields.veh
    })], { type: 'application/json' }));
    formData.append('license', fields.file);

    showToast("Saving license...", "info");
    try {
        const res = await profileService.registerDriver(formData);
        if (res?.success) {
            closeLicenseModal();
            showToast('Application submitted!', 'success');
            await checkDriverStatus();
        }
    } catch (error) {
        showToast("Submission failed", "error");
    }
}

// ==========================================
// 6. MODALS & POPUPS
// ==========================================

function openAddressModal(type = 'home') {
    const modal = document.getElementById('addressModal');
    const saveBtn = document.getElementById('saveButton');
    document.getElementById('addressType').value = type;
    modal.classList.replace('hidden', 'flex');

    const addr = state.addresses[type.toLowerCase()];
    if (addr) {
        document.getElementById('province').value = addr.province || '';
        document.getElementById('district').value = addr.district || '';
        document.getElementById('place').value = addr.place || '';
        document.getElementById('landmark').value = addr.landmark || '';
        updateLatLng(addr.latitude, addr.longitude);
        if (typeof updateMapFromLatAndLng === 'function') updateMapFromLatAndLng(addr.latitude, addr.longitude);

        saveBtn.onclick = updateAddress;
        saveBtn.querySelector('span').textContent = 'Update Address';
    } else {
        ['province', 'district', 'place', 'landmark', 'latitude', 'longitude'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        saveBtn.onclick = saveAddress;
        saveBtn.querySelector('span').textContent = 'Save Address';
    }

    // Leaflet fix: invalidate size after modal is visible
    setTimeout(() => {
        if (typeof map !== 'undefined') map.invalidateSize();
    }, 600);
    setTimeout(() => { if (typeof map !== 'undefined') map.invalidateSize(); }, 1200);
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.replace('flex', 'hidden');
}

function openPasswordModal() {
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('passwordModal').classList.replace('hidden', 'flex');
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.replace('flex', 'hidden');
}

function openLicenseModal() {
    document.getElementById('licenseModal').classList.replace('hidden', 'flex');
}

function closeLicenseModal() {
    document.getElementById('licenseModal').classList.replace('flex', 'hidden');
    document.getElementById('licensePreview').classList.add('hidden');
}

// Detail View Modals
function openOrderDetailModal() {
    const el = document.getElementById('orderDetailModal');
    el?.classList.replace('hidden', 'flex');
    document.body.style.overflow = 'hidden';
}

function closeOrderDetailModal() {
    const el = document.getElementById('orderDetailModal');
    el?.classList.replace('flex', 'hidden');
    document.body.style.overflow = '';
}

function openAppointmentDetailModal() {
    const el = document.getElementById('appointmentDetailModal');
    el?.classList.replace('hidden', 'flex');
    document.body.style.overflow = 'hidden';
}

function closeAppointmentDetailModal() {
    const el = document.getElementById('appointmentDetailModal');
    el?.classList.replace('flex', 'hidden');
    document.body.style.overflow = '';
}

// ==========================================
// 7. POPULATORS & STYLES
// ==========================================

function populateOrderDetailModal(order) {
    const statusStyle = getStatusStyle(order.status);
    const date = new Date(order.createdAt).toLocaleString();

    document.getElementById('popupOrderId').textContent = order.orderId;
    document.getElementById('popupStatus').textContent = order.status;
    document.getElementById('popupStatus').className = `text-base font-bold ${statusStyle.textClass} capitalize leading-none`;
    document.getElementById('popupStatusBg').className = `p-2.5 rounded-xl ${statusStyle.bgClass} ${statusStyle.textClass}`;
    document.getElementById('popupDate').textContent = date;
    document.getElementById('popupTotal').textContent = `Rs. ${order.totalAmount.toFixed(2)}`;

    const pay = order.payment;
    document.getElementById('popupPaymentMethod').textContent = pay ? pay.paymentMethod.replace(/_/g, ' ') : 'Cash on Delivery';
    document.getElementById('popupPaymentStatus').textContent = `Status: ${pay ? pay.paymentStatus : 'Pending'}`;

    const addr = order.address;
    document.getElementById('popupAddress').innerHTML = `
        <p class="font-bold text-slate-800">${addr.place}</p>
        <p>${addr.landmark || ''}</p>
        <p>${addr.district}, ${addr.province}</p>
        <p class="mt-2 text-indigo-600 font-medium">${order.phoneNumber || addr.phone || 'N/A'}</p>`;

    document.getElementById('popupItemsContainer').innerHTML = order.orderItems.map(item => `
        <div class="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div class="w-14 h-14 bg-white rounded-xl p-2 shadow-sm border flex-shrink-0">
                <img src="${item.product.imageUrl || '/assets/svg/CutLab.svg'}" class="w-full h-full object-contain">
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-[13px] font-bold text-slate-800 truncate">${item.product.title}</p>
                <div class="flex justify-between items-center mt-1">
                    <p class="text-[11px] font-medium text-slate-500">${item.quantity} × Rs. ${item.price.toFixed(2)}</p>
                    <p class="text-[13px] font-bold text-blue-600">Rs. ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        </div>`).join('');
}

function populateAppointmentDetailModal(apt) {
    const style = getAppointmentStatusStyle(apt.status);
    const dateStr = new Date(apt.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('aptPopupId').textContent = apt.appointmentId;
    const statusText = document.getElementById('aptPopupStatus');
    statusText.textContent = apt.status;
    statusText.className = `font-bold text-base leading-none ${style.textClass} capitalize`;
    document.getElementById('aptPopupStatusBg').className = `p-3 rounded-full ${style.bgClass} ${style.textClass}`;
    document.getElementById('aptPopupDate').textContent = dateStr;

    // Staff
    const staff = apt.staffResponse;
    const staffNameEl = document.getElementById('aptPopupStaffName');
    const staffImg = document.getElementById('aptStaffImg');
    const staffInitial = document.getElementById('aptStaffInitial');

    if (staff) {
        staffNameEl.textContent = staff.name || 'Specialist';
        document.getElementById('aptPopupStaffRole').textContent = staff.expertiseIn || 'Expert Stylist';
        if (staff.profileUrl) {
            staffImg.src = staff.profileUrl;
            staffImg.classList.remove('hidden');
            staffInitial.classList.add('hidden');
        } else {
            staffImg.classList.add('hidden');
            staffInitial.classList.remove('hidden');
            staffInitial.textContent = (staff.name || 'S').charAt(0).toUpperCase();
        }
    }

    // Service
    const svc = apt.serviceResponse;
    document.getElementById('aptPopupSvcName').textContent = svc?.name || 'Service';
    document.getElementById('aptPopupSvcDuration').textContent = `Duration: ${svc?.durationMinutes || 0} mins`;
    if (svc?.imageUrl) document.getElementById('aptPopupSvcImg').src = svc.imageUrl;

    document.getElementById('aptPopupDateVal').textContent = apt.appointmentDate;
    document.getElementById('aptPopupTimeVal').textContent = `${apt.startTime} - ${apt.endTime}`;
    document.getElementById('aptPopupNotes').textContent = apt.specialNotes || 'No notes provided';

    const pay = apt.paymentResponse;
    document.getElementById('aptPopupPaymentMethod').textContent = pay ? pay.paymentMethod.replace(/_/g, ' ') : 'Unpaid';
    document.getElementById('aptPopupPaymentStatus').textContent = `Status: ${pay?.paymentStatus || 'PENDING'}`;
    document.getElementById('aptPopupTotal').textContent = `Rs. ${apt.totalAmount.toFixed(2)}`;

    const payTypeEl = document.getElementById('aptPopupPaymentType');
    if (payTypeEl) {
        const full = apt.status.toLowerCase() === 'completed';
        payTypeEl.textContent = full ? 'Full Paid' : 'Advance Paid';
        payTypeEl.className = `font-bold text-sm ${full ? 'text-emerald-600' : 'text-amber-600'}`;
    }

    const actionArea = document.getElementById('aptActionArea');
    const status = apt.status.toLowerCase();
    if (status === 'booked' || status === 'pending') {
        actionArea.innerHTML = `<button onclick="cancelUserAppointment('${apt.appointmentId}'); closeAppointmentDetailModal();" class="w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold uppercase hover:bg-red-700 shadow-lg transition-all">Cancel Appointment</button>`;
    } else {
        actionArea.innerHTML = '';
    }
}

// Helpers
function getStatusStyle(status) {
    const s = status.toUpperCase();
    if (s === 'DELIVERED') return { bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' };
    if (s === 'CANCELLED') return { bgClass: 'bg-red-50', textClass: 'text-red-600' };
    if (s === 'SHIPPED') return { bgClass: 'bg-indigo-50', textClass: 'text-indigo-600' };
    return { bgClass: 'bg-blue-50', textClass: 'text-blue-600' };
}

function getAppointmentStatusStyle(status) {
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return { bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' };
    if (s === 'CANCELLED') return { bgClass: 'bg-red-50', textClass: 'text-red-600' };
    if (s === 'BOOKED' || s === 'PENDING') return { bgClass: 'bg-indigo-50', textClass: 'text-indigo-600' };
    return { bgClass: 'bg-slate-50', textClass: 'text-slate-600' };
}

// ==========================================
// 8. UTILITIES
// ==========================================

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const eye = button.querySelector('.eye');
    const slash = button.querySelector('.eye-slash');
    input.type = input.type === 'password' ? 'text' : 'password';
    eye?.classList.toggle('hidden');
    slash?.classList.toggle('hidden');
}

function updateAuthUI(isLoggedIn) {
    const btn = document.getElementById('loginBtn');
    const wrapper = document.getElementById('profileWrapper');
    if (btn) btn.classList.toggle('hidden', isLoggedIn);
    if (wrapper) wrapper.classList.toggle('hidden', !isLoggedIn);
}

function switchAddressTab(tab) {
    const isHome = tab === 'home';
    document.getElementById('homeTab').className = `${isHome ? 'tab-active' : 'tab-inactive'} px-6 py-3 rounded-full font-medium transition-all`;
    document.getElementById('workTab').className = `${!isHome ? 'tab-active' : 'tab-inactive'} px-6 py-3 rounded-full font-medium transition-all`;
    document.getElementById('homeAddress').classList.toggle('hidden', !isHome);
    document.getElementById('workAddress').classList.toggle('hidden', isHome);
}

function editAddress(type) { openAddressModal(type); }

function viewAllOrders() { window.location.href = '/orders.html'; }
function viewAllAppointments() { window.location.href = 'appointments.html'; }

// Map Locate Button
document.getElementById("locateMapBtn")?.addEventListener("click", async () => {
    const data = getAddressFormData();
    const address = [data.landmark, data.place, data.district, data.province, 'Nepal'].filter(Boolean).join(", ");
    if (!address.trim()) return showToast("Please fill address fields");

    try {
        const loc = await geocodeAddress(address);
        if (loc) {
            // Check if map and marker exist in the global scope
            let mapInstance = null;
            let markerInstance = null;

            try {
                if (typeof map !== 'undefined') mapInstance = map;
                if (typeof marker !== 'undefined') markerInstance = marker;
            } catch (e) {
                // Ignore if they truly aren't reachable
            }

            // Fallback to window object
            if (!mapInstance) mapInstance = window.map;
            if (!markerInstance) markerInstance = window.marker;

            if (mapInstance && markerInstance) {
                mapInstance.setView([loc.lat, loc.lng], 16);
                markerInstance.setLatLng([loc.lat, loc.lng]);
                updateLatLng(loc.lat, loc.lng);
            } else {
                showToast("Map is not fully loaded. Please wait.", "error");
                console.error("Map or marker not found in global scope.");
            }
        } else {
            showToast("Location not found", "error");
        }
    } catch (e) {
        console.error("Error during map geocoding:", e);
    }
});

// Listener for License File Preview
document.getElementById('licenseFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('licensePreview');
    const img = document.getElementById('licenseImagePreview');
    const name = document.getElementById('licenseFileName');

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
        img.classList.remove('hidden');
    } else {
        img.classList.add('hidden');
    }
    name.textContent = file.name;
    preview.classList.remove('hidden');
});
