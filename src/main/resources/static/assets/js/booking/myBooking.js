// State Management
const state = {
    appointments: [],
    isLoading: false,
    currentAppointment: null
};

// Initialize page - called after all scripts are loaded
async function init() {
    try {
        state.isLoading = true;
        await fetchAppointments();
    } catch (error) {
        console.error('Error initializing appointments page:', error);
        showToast('Failed to load appointments', 'error');
    } finally {
        state.isLoading = false;
    }
}

// Fetch all appointments
async function fetchAppointments() {
    try {
        const response = await BookingService.getAppointmentHistory();
        if (response?.success) {
            state.appointments = response.data || [];
            renderAppointmentsList();
        } else {
            showToast(response?.message || 'Failed to load appointments', 'error');
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
        showToast('Network error while loading appointments', 'error');
    }
}

// Render appointments list
function renderAppointmentsList() {
    const container = document.getElementById('appointmentsList');
    if (!container) return;

    if (state.appointments.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20">
                <svg class="w-24 h-24 text-slate-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl font-bold text-slate-700 mb-2">No Appointments Yet</h3>
                <p class="text-slate-500 mb-6">You haven't booked any services yet.</p>
                <a href="service.html" 
                    class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105">
                    Book Your First Appointment
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = state.appointments.map(apt => createAppointmentCard(apt)).join('');
}

// Create appointment card HTML
function createAppointmentCard(apt) {
    const statusStyles = getStatusStyle(apt.status);
    const serviceName = apt.response?.name || 'Service';
    const serviceImage = apt.response?.imageUrl || '/assets/svg/CutLab.svg';
    const totalAmount = apt.totalAmount || 0;

    // Format date
    const date = new Date(apt.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Get action button (cancel if applicable)
    const actionButton = getActionButton(apt);

    return `
        <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 overflow-hidden">
            <div class="flex flex-col md:flex-row">
                <!-- Service Image -->
                <div class="md:w-48 h-40 md:h-auto bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6 flex-shrink-0">
                    <img src="${serviceImage}" alt="${serviceName}" class="w-20 h-20 object-contain opacity-80">
                </div>

                <!-- Appointment Info -->
                <div class="flex-1 p-6">
                    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                ${serviceName}
                            </h3>
                            <p class="text-sm text-slate-500 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                ${date}
                            </p>
                        </div>
                        <span class="${statusStyles.bg} ${statusStyles.text} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                            ${apt.status}
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-4 mb-4">
                        <!-- Time -->
                        <div class="flex items-center gap-2 text-sm text-slate-600">
                            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span class="font-medium">${apt.startTime} - ${apt.endTime}</span>
                        </div>
                        
                        <!-- Payment Status -->
                        <div class="flex items-center gap-2 text-sm">
                            <span class="w-2 h-2 rounded-full ${apt.paymentStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                            <span class="text-slate-500">${apt.paymentStatus || 'PENDING'}</span>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <span class="text-xl font-black text-indigo-600">Rs. ${totalAmount.toFixed(2)}</span>
                        
                        <div class="flex items-center gap-3">
                            ${actionButton}
                            <button onclick="viewAppointmentDetails('${apt.appointmentId}')"
                                class="bg-slate-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-900 transition-colors flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get action button (cancel) based on status and time
function getActionButton(apt) {
    const status = apt.status.toLowerCase();

    // Only show cancel button for booked status
    if (status === 'booked') {
        // Check if appointment start time is at least 30 minutes from now
        // Parse appointment date correctly (local time)
        const [year, month, day] = apt.appointmentDate.split('-').map(Number);
        const appointmentDate = new Date(year, month - 1, day);

        // Parse start time (handles "10:00", "10:00:00", or "10:00 AM")
        const timeMatch = apt.startTime.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const ampm = timeMatch[3];

            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            appointmentDate.setHours(hours, minutes, 0, 0);
        }

        // Calculate difference in milliseconds
        const now = new Date();
        const timeDiff = appointmentDate.getTime() - now.getTime();
        const thirtyMinutesInMs = 30 * 60 * 1000;

        // Only show cancel button if appointment is more than 30 minutes away
        if (timeDiff > thirtyMinutesInMs) {
            return `
                <button onclick="cancelAppointment('${apt.appointmentId}')"
                    class="bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">
                    Cancel
                </button>
            `;
        }
    }

    return '';
}

// Get status styling
function getStatusStyle(status) {
    const s = status?.toUpperCase() || 'PENDING';
    const styles = {
        'BOOKED': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
        'PENDING': { bg: 'bg-blue-100', text: 'text-blue-700' },
        'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
        'CANCELLED': { bg: 'bg-red-100', text: 'text-red-700' },
        'NO_SHOW': { bg: 'bg-slate-100', text: 'text-slate-700' }
    };
    return styles[s] || styles['PENDING'];
}

// View appointment details
async function viewAppointmentDetails(appointmentId) {
    try {
        showToast('Loading appointment details...', 'info');

        const response = await BookingService.getSpecificAppointmentDetail(appointmentId);

        if (response?.success) {
            state.currentAppointment = response.data;
            populateAppointmentModal(response.data);
            openAppointmentDetailModal();
        } else {
            showToast(response?.message || 'Failed to load appointment details', 'error');
        }
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        showToast('Network error while loading details', 'error');
    }
}

// Populate appointment modal
function populateAppointmentModal(apt) {
    // Basic Info
    document.getElementById('aptPopupId').textContent = apt.appointmentId;
    document.getElementById('aptPopupStatus').textContent = apt.status;

    // Status styling
    const statusStyle = getAppointmentStatusStyle(apt.status);
    const statusBg = document.getElementById('aptPopupStatusBg');
    statusBg.className = `p-3 rounded-full ${statusStyle.bgClass} ${statusStyle.textClass}`;

    // Date
    const dateStr = new Date(apt.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    document.getElementById('aptPopupDate').textContent = dateStr;

    // Specialist
    const staff = apt.staffResponse;
    const staffNameEl = document.getElementById('aptPopupStaffName');
    const staffRoleEl = document.getElementById('aptPopupStaffRole');
    const staffImg = document.getElementById('aptStaffImg');
    const staffInitial = document.getElementById('aptStaffInitial');

    if (staff) {
        staffNameEl.textContent = staff.name || 'Specialist';
        staffRoleEl.textContent = staff.expertiseIn || 'Expert Stylist';
        if (staff.profileUrl) {
            staffImg.src = staff.profileUrl;
            staffImg.classList.remove('hidden');
            staffInitial.classList.add('hidden');
        } else {
            staffImg.classList.add('hidden');
            staffInitial.classList.remove('hidden');
            staffInitial.textContent = (staff.name || 'S').charAt(0).toUpperCase();
        }
    } else {
        staffNameEl.textContent = 'Any Specialist';
        staffRoleEl.textContent = 'Expert Stylist';
        staffImg.classList.add('hidden');
        staffInitial.classList.remove('hidden');
        staffInitial.textContent = 'A';
    }

    // Service
    const svc = apt.serviceResponse;
    document.getElementById('aptPopupSvcName').textContent = svc?.name || 'Service';
    document.getElementById('aptPopupSvcDuration').textContent = `Duration: ${svc?.durationMinutes || 0} mins`;
    if (svc?.imageUrl) {
        document.getElementById('aptPopupSvcImg').src = svc.imageUrl;
    } else {
        document.getElementById('aptPopupSvcImg').src = '/assets/svg/CutLab.svg';
    }

    // Schedule Values
    document.getElementById('aptPopupDateVal').textContent = apt.appointmentDate;
    document.getElementById('aptPopupTimeVal').textContent = `${apt.startTime} - ${apt.endTime}`;

    // Notes
    document.getElementById('aptPopupNotes').textContent = apt.specialNotes || 'No special notes provided';

    // Payment Info
    const pay = apt.paymentResponse;
    if (pay) {
        document.getElementById('aptPopupPaymentMethod').textContent = (pay.paymentMethod || 'Online').replace(/_/g, ' ');
        document.getElementById('aptPopupPaymentStatus').textContent = `Status: ${pay.paymentStatus || 'PENDING'} | Amount: Rs. ${pay.totalAmount?.toFixed(2) || '0.00'}`;
    } else {
        document.getElementById('aptPopupPaymentMethod').textContent = 'Unpaid / At Branch';
        document.getElementById('aptPopupPaymentStatus').textContent = 'Status: PENDING';
    }

    // Payment Type (Advance Paid or Full Paid based on status)
    const paymentTypeEl = document.getElementById('aptPopupPaymentType');
    if (paymentTypeEl) {
        const isFullPaid = apt.status.toLowerCase() === 'completed';
        paymentTypeEl.textContent = isFullPaid ? 'Full Paid' : 'Advance Paid';
        paymentTypeEl.className = `font-bold text-sm leading-none ${isFullPaid ? 'text-emerald-600' : 'text-amber-600'}`;
    }

    // Total
    document.getElementById('aptPopupTotal').textContent = `Rs. ${apt.totalAmount.toFixed(2)}`;

    // Actions (Cancellation button)
    const actionArea = document.getElementById('aptActionArea');
    const status = apt.status.toLowerCase();

    if (status === 'booked') {
        // Check 30 minute rule
        const [year, month, day] = apt.appointmentDate.split('-').map(Number);
        const appointmentDate = new Date(year, month - 1, day);

        const timeMatch = apt.startTime.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const ampm = timeMatch[3];

            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            appointmentDate.setHours(hours, minutes, 0, 0);
        }

        const now = new Date();
        const timeDiff = appointmentDate.getTime() - now.getTime();
        const thirtyMinutesInMs = 30 * 60 * 1000;

        if (timeDiff > thirtyMinutesInMs) {
            actionArea.innerHTML = `
                <button onclick="cancelAppointment('${apt.appointmentId}'); closeAppointmentDetailModal();"
                    class="w-full bg-red-600 text-white py-3.5 rounded-2xl font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-lg hover:shadow-red-100 transform hover:-translate-y-0.5 active:translate-y-0">
                    Cancel Appointment
                </button>
            `;
        } else {
            actionArea.innerHTML = `
                <p class="text-center text-sm text-slate-500 italic">
                    Cancellation unavailable - appointment is within 30 minutes
                </p>
            `;
        }
    } else {
        actionArea.innerHTML = '';
    }
}

function getAppointmentStatusStyle(status) {
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return { bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' };
    if (s === 'CANCELLED') return { bgClass: 'bg-red-50', textClass: 'text-red-600' };
    if (s === 'BOOKED' || s === 'PENDING') return { bgClass: 'bg-indigo-50', textClass: 'text-indigo-600' };
    return { bgClass: 'bg-slate-50', textClass: 'text-slate-600' };
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }

    try {
        showToast('Cancelling appointment...', 'info');

        const response = await BookingService.cancelAppointment(appointmentId);

        if (response?.success) {
            showToast('Appointment cancelled successfully', 'success');

            // Update local state
            const index = state.appointments.findIndex(a => a.appointmentId == appointmentId);
            if (index !== -1) {
                state.appointments[index].status = 'CANCELLED';
            }

            // Re-render list
            renderAppointmentsList();
        } else {
            showToast(response?.message || 'Failed to cancel appointment', 'error');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showToast('Network error while cancelling', 'error');
    }
}

// Modal controls
function openAppointmentDetailModal() {
    const modal = document.getElementById('appointmentDetailModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeAppointmentDetailModal() {
    const modal = document.getElementById('appointmentDetailModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

// Close modal on backdrop click
document.getElementById('appointmentDetailModal')?.addEventListener('click', function (e) {
    if (e.target === this) {
        closeAppointmentDetailModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeAppointmentDetailModal();
    }
});

// Initialize the page
init();
