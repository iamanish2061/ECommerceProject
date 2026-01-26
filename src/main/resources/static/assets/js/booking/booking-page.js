const BookingPage = {
    serviceId: null,
    service: null,
    selectedStaffId: null,
    selectedDate: null,
    selectedTimeSlot: null,

    init: async () => {
        // Parse serviceId from URL URLSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        BookingPage.serviceId = urlParams.get('serviceId');
        document.getElementById('cartBtn').addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
        if (!BookingPage.serviceId) {
            showToast('Service ID not found', 'error');
            setTimeout(() => window.location.href = 'service.html', 2000);
            return;
        }

        Promise.all([
            BookingPage.loadServiceDetails(),
            BookingPage.loadCartCount()
        ]).then(() => {
            BookingPage.setupEventListeners();
        });
    },

    loadCartCount: async () => {
        const response = await ServiceService.getCartCount();
        if (response.success) {
            document.getElementById('cartCount').innerText = response.data.totalCartItems;
        }
    },

    loadServiceDetails: async () => {
        showToast('Loading service details...', 'info');
        try {
            document.getElementById('loadingState').classList.remove('hidden');
            document.getElementById('bookingContent').classList.add('hidden');

            const response = await ServiceService.getServiceDetail(BookingPage.serviceId);

            const serviceData = response.data.serviceListResponse || response;
            const staffList = response.data.specialists || [];

            BookingPage.service = serviceData;
            BookingPage.renderServiceInfo(serviceData);
            BookingPage.renderStaffList(staffList);

            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('bookingContent').classList.remove('hidden');

        } catch (error) {
            console.error('Failed to load service:', error);
            showToast('Failed to load service details', 'error');
        }
    },

    renderServiceInfo: (service) => {
        document.getElementById('serviceName').textContent = service.name;
        document.getElementById('serviceCategory').textContent = service.category || 'Service';
        document.getElementById('servicePrice').textContent = service.price;
        document.getElementById('serviceDuration').textContent = service.durationMinutes;
        document.getElementById('serviceDesc').textContent = service.description || 'No description available.';

        // Update price calculation footer
        document.getElementById('totalPriceDisplay').textContent = service.price;
        const advance = (service.price * 0.10).toFixed(2);
        document.getElementById('advanceAmount').textContent = advance;

        if (service.imageUrl) {
            document.getElementById('serviceImg').src = service.imageUrl;
        } else {
            document.getElementById('serviceImg').src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';
        }
    },

    renderStaffList: (staffList) => {
        const container = document.getElementById('specialistList');
        container.innerHTML = '';

        // Option for "Any Specialist"
        const anyCard = document.createElement('div');
        anyCard.className = 'staff-card active group relative flex flex-col items-center p-3 rounded-2xl border-2 cursor-pointer transition-all hover:border-blue-400 bg-white min-w-[110px] shrink-0';
        anyCard.innerHTML = `
            <div class="relative w-12 h-12 mb-2 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <div class="check-icon absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center scale-0 opacity-0 transition-all">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
            </div>
            <p class="text-[11px] font-bold text-slate-700 text-center leading-tight">Any Specialist</p>
            <p class="text-[9px] text-slate-400">Recommended</p>
        `;
        anyCard.onclick = () => BookingPage.selectStaff(anyCard, null);
        container.appendChild(anyCard);

        staffList.forEach(staff => {
            const card = document.createElement('div');
            card.className = 'staff-card group relative flex flex-col items-center p-3 rounded-2xl border-2 border-slate-100 cursor-pointer transition-all hover:border-blue-400 bg-white min-w-[110px] shrink-0';

            const profileImg = staff.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name || staff.fullName)}&background=random`;

            card.innerHTML = `
                <div class="relative w-12 h-12 mb-2">
                    <img src="${profileImg}" class="w-full h-full rounded-full object-cover border-2 border-white shadow-sm" alt="${staff.name || staff.fullName}">
                    <div class="check-icon absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center scale-0 opacity-0 transition-all">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-[11px] font-bold text-slate-700 text-center leading-tight truncate w-full">${staff.name || staff.fullName}</p>
                <p class="text-[9px] text-slate-400 truncate w-full text-center">${staff.expertiseIn || 'Expert'}</p>
            `;
            card.onclick = () => BookingPage.selectStaff(card, staff.staffId || staff.id);
            container.appendChild(card);
        });
    },

    selectStaff: (element, staffId) => {
        document.querySelectorAll('.staff-card').forEach(el => {
            el.classList.remove('active', 'border-blue-600', 'bg-blue-50');
            el.classList.add('border-slate-100');

            const checkIcon = el.querySelector('.check-icon');
            if (checkIcon) {
                checkIcon.classList.remove('scale-100', 'opacity-100');
                checkIcon.classList.add('scale-0', 'opacity-0');
            }
        });

        element.classList.remove('border-slate-100');
        element.classList.add('active', 'border-blue-600', 'bg-blue-50');

        const checkIcon = element.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.classList.remove('scale-0', 'opacity-0');
            checkIcon.classList.add('scale-100', 'opacity-100');
        }

        BookingPage.selectedStaffId = staffId;
        document.getElementById('timeSelectionWrapper').classList.add('hidden');
        document.getElementById('paymentSection').classList.add('hidden');
    },

    setupEventListeners: () => {
        const dateInput = document.getElementById('bookingDate');
        const checkBtn = document.getElementById('checkAvailabilityBtn');

        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        if (dateInput) {
            dateInput.min = today;
            dateInput.value = today;
            BookingPage.selectedDate = today;
        }

        dateInput.addEventListener('change', (e) => {
            BookingPage.selectedDate = e.target.value;
            // Hide time and payment sections on change
            document.getElementById('timeSelectionWrapper').classList.add('hidden');
            document.getElementById('paymentSection').classList.add('hidden');
        });

        checkBtn.addEventListener('click', BookingPage.loadTimeSlots);
        document.getElementById('proceedToBookBtn').addEventListener('click', BookingPage.handleBooking);
    },

    loadTimeSlots: async () => {
        if (!BookingPage.selectedDate) {
            showToast('Please select a date first', 'warning');
            return;
        }

        const checkBtn = document.getElementById('checkAvailabilityBtn');
        const originalBtnText = checkBtn.innerHTML;
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<span class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Checking...';

        showToast('Checking availability...', 'info');
        try {
            const response = await BookingService.getAvailableTimesAndRecommendations(
                BookingPage.serviceId,
                BookingPage.selectedDate,
                BookingPage.selectedStaffId
            );

            if (response.success) {
                document.getElementById('timeSelectionWrapper').classList.remove('hidden');

                let availableSlots = [];
                let recommendedSlots = [];

                // Backend returns Map if logged in, List if not
                if (Array.isArray(response.data)) {
                    availableSlots = response.data;
                    document.getElementById('recommendedContainer').classList.add('hidden');
                } else {
                    availableSlots = response.data.AvailableTime || [];
                    recommendedSlots = response.data.RecommendedTime || [];

                    if (recommendedSlots.length > 0) {
                        document.getElementById('recommendedContainer').classList.remove('hidden');
                        BookingPage.renderRecommendations(recommendedSlots);
                    } else {
                        document.getElementById('recommendedContainer').classList.add('hidden');
                    }
                }

                BookingPage.renderAvailableSlots(availableSlots);

                // Scroll to slots
                document.getElementById('timeSelectionWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                showToast(response.message || 'Failed to fetch slots', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error loading slots', 'error');
        } finally {
            checkBtn.disabled = false;
            checkBtn.innerHTML = originalBtnText;
        }
    },

    renderAvailableSlots: (slots) => {
        const container = document.getElementById('timeSlots');
        container.innerHTML = '';

        if (slots.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center text-slate-400 text-[10px] py-2">No slots available</p>';
            return;
        }

        slots.forEach(slot => {
            const btn = document.createElement('button');
            btn.className = 'time-slot-btn py-1.5 px-1 rounded-lg border border-slate-100 text-xs text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all font-medium bg-slate-50/50';
            const timeLabel = slot.startTime.substring(0, 5);
            btn.textContent = timeLabel;
            btn.onclick = () => BookingPage.selectTimeSlot(btn, slot);
            container.appendChild(btn);
        });
    },

    renderRecommendations: (recommendations) => {
        const container = document.getElementById('recommendedSlots');
        container.innerHTML = '';

        recommendations.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'rec-slot flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-blue-400 transition-all group';

            const timeLabel = rec.startTime.substring(0, 5);

            div.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-800">${timeLabel}</p>
                        <p class="text-[9px] text-slate-400">${rec.matchLabel || 'Recommended'}</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 px-3 border-x border-slate-50">
                    <img src="${rec.staff.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rec.staff.name || 'S')}&background=random`}" 
                         class="w-7 h-7 rounded-full object-cover border border-slate-100 shadow-sm" 
                         alt="${rec.staff.name || 'Staff'}">
                    <div class="hidden sm:block text-left">
                        <p class="text-[10px] font-bold text-slate-700 truncate max-w-[70px]">${rec.staff.name || 'Specialist'}</p>
                        <p class="text-[8px] text-slate-400">Specialist</p>
                    </div>
                </div>

                <div class="text-right">
                    <p class="text-[10px] font-bold text-blue-600">${rec.matchScore}%</p>
                </div>
            `;

            div.onclick = () => {
                BookingPage.selectTimeSlot(div, rec, true);
            };
            container.appendChild(div);
        });
    },

    selectTimeSlot: (element, slot, isRec = false) => {
        // Reset all selections
        document.querySelectorAll('.time-slot-btn, .rec-slot').forEach(el => {
            el.classList.remove('border-blue-600', 'bg-blue-50/50', 'ring-4', 'ring-blue-100/30', 'shadow-md');
            el.classList.add('border-slate-100');
            if (el.classList.contains('time-slot-btn')) {
                el.classList.remove('bg-blue-600', 'text-white', 'border-transparent', 'shadow-blue-100', 'hover:text-white');
                el.classList.add('text-slate-600');
            }
        });

        // Style the selected one
        if (isRec) {
            element.classList.remove('border-slate-100');
            element.classList.add('border-blue-600', 'bg-blue-50/50', 'ring-4', 'ring-blue-100/30', 'shadow-md');

            // Also highlight matching regular slot if exists
            const timeLabel = slot.startTime.substring(0, 5);
            document.querySelectorAll('.time-slot-btn').forEach(btn => {
                if (btn.textContent === timeLabel) {
                    btn.classList.add('bg-blue-600', 'text-white', 'border-transparent', 'shadow-md', 'shadow-blue-100', 'hover:text-white');
                }
            });
            BookingPage.selectedStaffId = slot.staff.staffId;
        } else {
            element.classList.remove('text-slate-600', 'border-slate-100');
            element.classList.add('bg-blue-600', 'text-white', 'border-transparent', 'shadow-md', 'shadow-blue-100', 'ring-4', 'ring-blue-100/30', 'hover:text-white');
        }

        BookingPage.selectedTimeSlot = slot;

        // Show payment section
        const paymentSection = document.getElementById('paymentSection');
        paymentSection.classList.remove('hidden');
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
    },

    handleBooking: async () => {
        const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');

        if (!BookingPage.selectedDate || !BookingPage.selectedTimeSlot) {
            showToast('Please select a date and time slot first', 'error');
            return;
        }

        if (!paymentMethodInput) {
            showToast('Please select a payment method', 'error');
            return;
        }

        const btn = document.getElementById('proceedToBookBtn');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Processing...';

        try {
            const startTimeStr = BookingPage.selectedTimeSlot.startTime;
            const duration = BookingPage.service.durationMinutes || 0;

            // Calculate end time
            const [hours, minutes] = startTimeStr.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0);

            const endDate = new Date(startDate.getTime() + duration * 60000);
            const endTimeStr = endDate.toTimeString().split(' ')[0]; // HH:mm:ss
            const formattedStartTime = startTimeStr.split(':').length === 2 ? startTimeStr + ':00' : startTimeStr;

            const bookingData = {
                serviceId: BookingPage.serviceId,
                staffId: BookingPage.selectedStaffId || 0,
                bookingDate: BookingPage.selectedDate,
                startTime: formattedStartTime,
                endTime: endTimeStr,
                specialNotes: document.getElementById('specialNotes').value,
                paymentMethod: paymentMethodInput.value
            };

            const response = await BookingService.createBooking(bookingData);

            if (response.success) {
                showToast('Booking initiated! Redirecting to payment...', 'success');

                const redirectData = response.data;

                if (redirectData.method === 'ESEWA' && redirectData.esewa) {
                    BookingPage.handleEsewaPayment(redirectData.esewa);
                } else if (redirectData.method === 'KHALTI' && redirectData.url) {
                    window.location.href = redirectData.url;
                } else {
                    showToast('Booking success! Redirecting to appointments...', 'success');
                    setTimeout(() => window.location.href = 'appointments.html', 1500);
                }
            } else {
                showToast(response.message || "Failed to book the appointment", "error");
                throw new Error(response.message || 'Booking failed');
            }

        } catch (error) {
            console.error(error);
            showToast(error.message || 'Booking failed', 'error');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    },

    handleEsewaPayment: (esewaData) => {
        document.getElementById("esewa_amount").value = esewaData.amount;
        document.getElementById("esewa_tax_amount").value = esewaData.taxAmt;
        document.getElementById("esewa_total_amount").value = esewaData.total_amount;
        document.getElementById("esewa_transaction_uuid").value = esewaData.transaction_uuid;
        document.getElementById("esewa_product_code").value = "EPAYTEST";

        document.getElementById("esewa_product_service_charge").value = esewaData.productServiceCharge;
        document.getElementById("esewa_product_delivery_charge").value = esewaData.productDeliveryCharge;
        document.getElementById("esewa_success_url").value = "http://localhost:8080/api/payment/esewa-response-handle";
        document.getElementById("esewa_failure_url").value = "http://localhost:8080/api/payment/esewa-response-handle";
        document.getElementById("esewa_signature").value = esewaData.signature;

        document.getElementById("esewaForm").submit();
    }
};

document.addEventListener('DOMContentLoaded', BookingPage.init);
