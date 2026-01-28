let revenueChart = null;
let categoryChart = null;


document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    await loadReportData();
    setupPeriodSelectors();
});


function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!sidebar || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('w-64');
        sidebar.classList.toggle('w-20');

        const closeIcon = document.getElementById('sidebarCloseIcon');
        const openIcon = document.getElementById('sidebarOpenIcon');

        if (sidebar.classList.contains('w-20')) {
            closeIcon?.classList.add('hidden');
            openIcon?.classList.remove('hidden');
        } else {
            closeIcon?.classList.remove('hidden');
            openIcon?.classList.add('hidden');
        }

        const labels = sidebar.querySelectorAll('.nav-label');
        labels.forEach(label => label.classList.toggle('hidden'));
    });

    logoutBtn?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            const response = await AuthService.logout();
            if (response?.success) {
                window.location.href = '/auth/login.html';
            }
        }
    });
}

async function loadReportData() {
    showToast('Fetching latest reports...', 'info');
    try {
        const [salesRes, productsRes, servicesRes, staffRes, categoryRes] = await Promise.all([
            ReportService.getSalesData('weekly'),
            ReportService.getTopProducts(),
            ReportService.getTopServices(),
            ReportService.getStaffPerformance(),
            ReportService.getSalesByCategory()
        ]);

        if (salesRes.success) initRevenueChart(salesRes.data);
        if (productsRes.success) renderTopProducts(productsRes.data);
        if (servicesRes.success) renderTopServices(servicesRes.data);
        if (staffRes.success) renderStaffPerformance(staffRes.data);
        if (categoryRes.success) initCategoryChart(categoryRes.data);


    } catch (error) {
        console.error('Error loading reports:', error);
        showToast('Failed to load report data', 'error');
    }
}

function initRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Revenue (Rs.)',
                data: data.data,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4F46E5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#64748b', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 11 } }
                }
            }
        }
    });
}

function initCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Products', 'Services'],
            datasets: [{
                data: [data.products, data.services],
                backgroundColor: ['#4F46E5', '#10B981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20, font: { size: 11 } }
                }
            },
            cutout: '70%'
        }
    });
}


function renderTopProducts(products) {
    const tableBody = document.getElementById('topProductsTable');
    tableBody.innerHTML = products.map(p => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
            <td class="py-4 font-medium text-slate-800">${p.name}</td>
            <td class="py-4 text-slate-500">${p.category}</td>
            <td class="py-4 font-bold text-slate-700">${p.sales}</td>
            <td class="py-4 text-indigo-600 font-bold">Rs. ${p.revenue.toLocaleString()}</td>
        </tr>
    `).join('');
}

function renderTopServices(services) {
    const tableBody = document.getElementById('topServicesTable');
    tableBody.innerHTML = services.map(s => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
            <td class="py-4 font-medium text-slate-800">${s.name}</td>
            <td class="py-4 font-bold text-slate-700">${s.bookings}</td>
            <td class="py-4 text-indigo-600 font-bold">Rs. ${s.revenue.toLocaleString()}</td>
        </tr>
    `).join('');
}

function renderStaffPerformance(staff) {
    const tableBody = document.getElementById('staffPerformanceTable');
    tableBody.innerHTML = staff.map(s => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
            <td class="py-4 font-medium text-slate-800">${s.name}</td>
            <td class="py-4 text-slate-500">${s.role}</td>
            <td class="py-4 font-bold text-slate-700">${s.appointments}</td>
            <td class="py-4 text-indigo-600 font-bold">Rs. ${s.revenue.toLocaleString()}</td>
        </tr>
    `).join('');
}

function setupPeriodSelectors() {
    const buttons = document.querySelectorAll('.period-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            buttons.forEach(b => {
                b.classList.remove('bg-indigo-50', 'text-indigo-600');
                b.classList.add('text-slate-500');
            });
            btn.classList.add('bg-indigo-50', 'text-indigo-600');

            const period = btn.dataset.period;
            showToast(`Fetching ${period} reports...`, 'info');
            const response = await ReportService.getSalesData(period);
            if (response.success) {
                initRevenueChart(response.data);
            }
        });
    });
}

function getIcon(name) {
    const icons = {
        'currency-dollar': `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
        'shopping-bag': `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`,
        'calendar': `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
        'star': `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>`
    };
    return icons[name] || '';
}


