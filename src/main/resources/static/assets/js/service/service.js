document.addEventListener('DOMContentLoaded', () => {
    ServicePage.init();
});

const ServicePage = {
    selectedCategory: 'all',
    searchQuery: '',
    services: [],
    selectedService: null,
    selectedStaffId: null,
    selectedDateTime: null,

    init: async () => {
        this.selectedCategory = 'all';
        this.searchQuery = '';
        document.getElementById('cartBtn').addEventListener('click', () => {
            window.location.href = 'cart.html';
        });

        Promise.all([
            ServicePage.loadCategories(),
            ServicePage.loadServices(),
            ServicePage.loadCartCount()
        ]).then(() => {
            ServicePage.setupEventListeners();
            ServicePage.setupMobileEventListeners();
        });
    },

    loadCartCount: async () => {
        const response = await ServiceService.getCartCount();
        if (response.success) {
            document.getElementById('cartCount').innerText = response.data.totalCartItems;
        }
    },

    setupEventListeners: () => {
        // Search listener
        const searchInput = document.getElementById('serviceSearch');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                ServicePage.searchQuery = e.target.value;
                ServicePage.loadServices();
            }, 500);
        });
    },
    
    setupMobileEventListeners: () => {
        // Hamburger Menu
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', ServicePage.toggleMobileMenu);
        }

        // Mobile Filter Sidebar
        const mobileFilterBtn = document.getElementById('mobileFilterBtn');
        if (mobileFilterBtn) {
            mobileFilterBtn.addEventListener('click', ServicePage.toggleSidebar);
        }

        // Close Sidebar (Overlay & Close Button)
        const overlay = document.getElementById('sidebarOverlay');
        const closeBtn = document.getElementById('sidebarClose');
        if (overlay) overlay.addEventListener('click', ServicePage.closeSidebar);
        if (closeBtn) closeBtn.addEventListener('click', ServicePage.closeSidebar);

        // Mobile Search Sync
        const mobileSearch = document.getElementById('mobileSearchInput');
        const desktopSearch = document.getElementById('serviceSearch');
        if (mobileSearch && desktopSearch) {
            mobileSearch.addEventListener('input', (e) => {
                desktopSearch.value = e.target.value;
                // Trigger search logic - no need to dispatch event as we just need value
                ServicePage.searchQuery = e.target.value;
                ServicePage.loadServices();
            });
            desktopSearch.addEventListener('input', (e) => {
                mobileSearch.value = e.target.value;
            });
        }
    },

    toggleMobileMenu: () => {
        const hamburger = document.getElementById('hamburgerBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        if (hamburger && mobileMenu) {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('show');
        }
    },

    toggleSidebar: () => {
        const sidebar = document.getElementById('mobileSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    },

    closeSidebar: () => {
        const sidebar = document.getElementById('mobileSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    },

    loadCategories: async () => {
        const response = await ServiceService.getAllCategories();
        if (response.success) {
            const list = document.getElementById('categoryList');
            const mobileList = document.getElementById('mobileCategoryList');

            // Keep "All" and add rest
            response.data.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <button class="category-pill w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600" 
                            data-category="${category}">
                        ${category}
                    </button>
                `;
                if (list) list.appendChild(li);
                if (mobileList) mobileList.appendChild(li.cloneNode(true));
            });

            // Add click listeners to category pills (desktop and mobile)
            document.querySelectorAll('.category-pill').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    document.querySelectorAll('.category-pill').forEach(p => {
                        // Remove active class from all pills with same category to sync desktop/mobile
                        if (p.dataset.category !== pill.dataset.category) {
                            p.classList.remove('active', 'bg-blue-600', 'text-white');
                        }
                    });

                    // Add active class to clicked pill and its counterparts
                    const category = pill.dataset.category;
                    document.querySelectorAll(`.category-pill[data-category="${category}"]`).forEach(p => {
                        p.classList.add('active', 'bg-blue-600', 'text-white');
                    });

                    ServicePage.selectedCategory = category;
                    ServicePage.loadServices();

                    // Close mobile sidebar if open
                    if (window.innerWidth < 1024) {
                        ServicePage.closeSidebar();
                    }
                });
            });
        }
    },

    loadServices: async () => {
        const grid = document.getElementById('serviceGrid');
        const emptyState = document.getElementById('emptyState');
        grid.innerHTML = '<div class="col-span-full flex justify-center py-10"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>';

        let response;
        if (ServicePage.searchQuery) {
            response = await ServiceService.searchServices(ServicePage.searchQuery);
        } else if (ServicePage.selectedCategory !== 'all') {
            response = await ServiceService.getServicesByCategory(ServicePage.selectedCategory);
        } else {
            response = await ServiceService.getAllServices();
        }

        if (response.success && response.data.length > 0) {
            ServicePage.services = response.data;
            grid.innerHTML = '';
            emptyState.classList.add('hidden');
            document.getElementById('serviceCount').innerText = response.data.length;

            response.data.forEach(service => {
                grid.appendChild(ServicePage.createServiceCard(service));
            });
        } else {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            document.getElementById('serviceCount').innerText = '0';
        }
    },

    createServiceCard: (service) => {
        const div = document.createElement('div');
        div.className = 'service-card bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-blue-100/50 transition-all cursor-pointer group';
        div.innerHTML = `
            <div class="relative h-56 overflow-hidden">
                <img src="${service.imageUrl || '/assets/svg/service-placeholder.svg'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${service.name}">
                <div class="service-overlay absolute inset-0 bg-blue-900/40 opacity-0 transition-opacity flex items-center justify-center">
                    <button class="px-6 py-2 bg-white text-blue-600 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">Book Now</button>
                </div>
                <div class="absolute top-4 left-4">
                    <span class="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-blue-600 shadow-sm">${service.category}</span>
                </div>
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-xl font-bold text-slate-600">${service.name}</h3>
                </div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xl font-bold text-blue-600">Rs.${service.price}</span>
                </div>
                <p class="text-slate-500 text-sm line-clamp-2 mb-4">${service.description || 'Professional salon service'}</p>
                <div class="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${service.durationMinutes} mins</span>
                    <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Unisex</span>
                </div>
            </div>
        `;
        div.onclick = () => {
            window.location.href = `booking.html?serviceId=${service.id}`;
        };
        return div;
    }
};
