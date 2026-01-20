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
        const anyBtn = document.createElement('button');
        anyBtn.className = 'staff-pill active px-4 py-2 rounded-full border border-slate-200 text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-all bg-blue-600 text-white border-transparent';
        anyBtn.textContent = 'Any Specialist';
        anyBtn.dataset.id = 'any';
        anyBtn.onclick = () => BookingPage.selectStaff(anyBtn, null);
        container.appendChild(anyBtn);

        staffList.forEach(staff => {
            const btn = document.createElement('button');
            btn.className = 'staff-pill px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all bg-white';
            btn.textContent = staff.fullName || staff.name; // Adjust based on API response
            btn.dataset.id = staff.id;
            btn.onclick = () => BookingPage.selectStaff(btn, staff.id);
            container.appendChild(btn);
        });
    },

    selectStaff: (btn, staffId) => {
        // Reset styles
        document.querySelectorAll('.staff-pill').forEach(el => {
            el.classList.remove('bg-blue-600', 'text-white', 'border-transparent');
            el.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
        });

        // specific "Any" button logic logic if needed, but styling is enough
        btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
        btn.classList.add('bg-blue-600', 'text-white', 'border-transparent');

        BookingPage.selectedStaffId = staffId;

        // Refresh slots if date is selected
        if (BookingPage.selectedDate) {
            BookingPage.loadTimeSlots(BookingPage.selectedDate);
        }
    },

    setupEventListeners: () => {
        const dateInput = document.getElementById('bookingDate');

        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;

        dateInput.addEventListener('change', (e) => {
            BookingPage.selectedDate = e.target.value;
            // Hide recs, show manual slots
            document.getElementById('recommendationArea').classList.add('hidden');
            document.getElementById('timeSlots').classList.remove('hidden');
            BookingPage.loadTimeSlots(e.target.value);
        });

        document.getElementById('getRecommendationsBtn').addEventListener('click', BookingPage.loadRecommendations);
        document.getElementById('showManualTimeBtn').addEventListener('click', () => {
            document.getElementById('recommendationArea').classList.add('hidden');
            document.getElementById('timeSlots').classList.remove('hidden');
            if (BookingPage.selectedDate) BookingPage.loadTimeSlots(BookingPage.selectedDate);
        });

        document.getElementById('proceedToBookBtn').addEventListener('click', BookingPage.handleBooking);
    },

    loadTimeSlots: async (date) => {
        BookingPage.selectedTimeSlot = null; // Reset selection
        const container = document.getElementById('timeSlots');
        container.innerHTML = '<p class="col-span-3 text-center text-slate-500 text-sm py-4">Loading slots...</p>';

        try {
            // Simulated logic or real API for available slots
            // Ideally: GET /bookings/slots?date=...&staffId=...&serviceId=...
            // For now, generating static slots working hours (10 AM to 7 PM)
            // In a real app, you'd fetch booked slots and exclude them.

            // Mocking available slots for demonstration
            container.innerHTML = '';
            const startHour = 10;
            const endHour = 19;
            const duration = BookingPage.service.durationMinutes || 60;

            // If API exists: const slots = await BookingService.getAvailableSlots(...)

            for (let h = startHour; h < endHour; h++) {
                const hourFormatted = h < 10 ? `0${h}` : h;
                const timeLabel = `${hourFormatted}:00`;

                const btn = document.createElement('button');
                btn.className = 'time-slot-btn py-2 px-1 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all';
                btn.textContent = timeLabel;
                btn.onclick = () => BookingPage.selectTimeSlot(btn, timeLabel);
                container.appendChild(btn);
            }

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p class="col-span-3 text-red-500 text-xs text-center">Error loading slots</p>';
        }
    },

    selectTimeSlot: (btn, time) => {
        document.querySelectorAll('.time-slot-btn').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white', 'border-transparent', 'shadow-md');
            b.classList.add('border-slate-200', 'text-slate-600');
        });

        if (btn) {
            btn.classList.remove('border-slate-200', 'text-slate-600');
            btn.classList.add('bg-blue-600', 'text-white', 'border-transparent', 'shadow-md');
        }
        BookingPage.selectedTimeSlot = time;
    },

    loadRecommendations: async () => {
        // ... (Similar logic to existing modal AI recs)
        const recArea = document.getElementById('recommendationArea');
        const normalSlots = document.getElementById('timeSlots');

        normalSlots.classList.add('hidden');
        recArea.classList.remove('hidden');

        const recContainer = document.getElementById('recommendedSlots');
        recContainer.innerHTML = '<p class="text-center text-xs text-slate-400">Analyzing schedule...</p>';

        try {
            // const recommendations = await BookingService.getRecommendations({...});
            // Mocking for now
            setTimeout(() => {
                recContainer.innerHTML = '';
                const mockRecs = [
                    { time: '14:00', score: 98, reason: 'High staff availability' },
                    { time: '16:30', score: 85, reason: 'Less crowded' }
                ];

                mockRecs.forEach(rec => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors';
                    div.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-slate-700">${rec.time}</span>
                            <span class="text-xs text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">${rec.score}% match</span>
                        </div>
                        <span class="text-xs text-slate-500 italic">${rec.reason}</span>
                    `;
                    div.onclick = () => {
                        BookingPage.selectedTimeSlot = rec.time;
                        // Visual feedback selection
                        Array.from(recContainer.children).forEach(c => c.classList.remove('ring-2', 'ring-blue-500'));
                        div.classList.add('ring-2', 'ring-blue-500');
                    };
                    recContainer.appendChild(div);
                });
            }, 800);
        } catch (e) {
            recContainer.innerHTML = '<p class="text-red-500 text-xs">Failed to get recommendations</p>';
        }
    },

    handleBooking: async () => {
        if (!AuthService.isLoggedIn()) {
            showToast('Please login to book an appointment', 'warning');
            // Store return URL?
            setTimeout(() => window.location.href = 'index.html', 1500);
            // In a real flow, better to open login modal or redirect to login page
            return;
        }

        if (!BookingPage.selectedDate || !BookingPage.selectedTimeSlot) {
            showToast('Please select a date and time', 'warning');
            return;
        }

        const btn = document.getElementById('proceedToBookBtn');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Processing...';

        try {
            const bookingData = {
                serviceId: BookingPage.serviceId,
                staffId: BookingPage.selectedStaffId, // null means "Any"
                appointmentDate: BookingPage.selectedDate,
                startTime: BookingPage.selectedTimeSlot,
                notes: document.getElementById('specialNotes').value
            };

            const response = await BookingService.createBooking(bookingData);
            // Assuming response contains payment details or success

            showToast('Booking initiated! Redirecting to payment...', 'success');

            // Redirect to payment or confirmation
            // For now, redirect to a success/payment page or back to services
            setTimeout(() => {
                // If backend returns a payment link or transaction ID
                // window.location.href = `/payment.html?bookingId=${response.id}`;
                window.location.href = 'appointments.html'; // Fallback
            }, 1000);

        } catch (error) {
            console.error(error);
            showToast(error.message || 'Booking failed', 'error');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
};

document.addEventListener('DOMContentLoaded', BookingPage.init);
