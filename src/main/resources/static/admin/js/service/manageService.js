/**
 * manageService.js - Admin service management logic
 * Refactored to match manageProduct.js structure
 */

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

const ServiceManager = {
    state: {
        services: [],
        categories: []
    },

    init: async () => {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', ServiceManager.handleLogout);

        await ServiceManager.loadAllData();
        ServiceManager.setupEventListeners();
        ServiceManager.setupCategoryToggles();
    },

    handleLogout: async () => {
        if (!confirm('Are you sure you want to logout?')) return;
        try {
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
                await AuthService.logout();
                window.location.href = '/auth/login.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    loadAllData: async () => {
        try {
            // Fetch services and active categories in parallel
            const [servicesRes, categoriesRes] = await Promise.all([
                ManageServiceService.getAllServices(),
                ManageServiceService.getAllCategories()
            ]);

            let allCategories = new Set();

            // 1. Add categories from all loaded services (active & inactive)
            if (servicesRes.success) {
                ServiceManager.state.services = servicesRes.data;
                servicesRes.data.forEach(s => {
                    if (s.category) allCategories.add(s.category);
                });
            }

            // 2. Add active categories from backend (legacy/other sources)
            if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
                categoriesRes.data.forEach(c => allCategories.add(c));
            }

            ServiceManager.state.categories = Array.from(allCategories).filter(Boolean).sort();
            ServiceManager.populateCategorySelect();
            ServiceManager.renderServiceTable();

        } catch (error) {
            console.error("Failed to load data", error);
            showToast("Failed to load data", "error");
        }
    },

    populateCategorySelect: () => {
        const select = document.getElementById('categorySelect');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '<option value="">Select Category</option>' +
                ServiceManager.state.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            if (currentVal) select.value = currentVal;
        }
    },

    renderServiceTable: () => {
        const tbody = document.getElementById('servicesTableBody');
        const filter = document.getElementById('serviceSearch').value.toLowerCase();

        const filteredServices = ServiceManager.state.services.filter(s =>
            s.name.toLowerCase().includes(filter) ||
            s.category.toLowerCase().includes(filter)
        );

        if (filteredServices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400">No services found.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredServices.map(service => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${service.imageUrl || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg object-cover bg-slate-200" alt="${service.name}">
                        <div>
                            <div class="text-sm font-bold text-slate-800">${service.name}</div>
                            <div class="text-xs text-slate-400">ID: ${service.id}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-sm text-slate-600 font-medium">
                    <span class="px-2 py-1 bg-slate-100 rounded text-xs">${service.category}</span>
                </td>
                <td class="p-4 text-sm font-bold text-slate-700">
                    Rs ${service.price}
                </td>
                <td class="p-4 text-sm text-slate-600">
                    <div class="flex items-center gap-1">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${service.durationMinutes} min
                    </div>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${service.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}">
                        ${service.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="p-4">
                    <div class="flex gap-2">
                        <button onclick="ServiceManager.handleEditClick(${service.id})" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="ServiceManager.handleToggleStatus(${service.id})" class="p-2 ${service.active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'} rounded-lg transition-colors" title="${service.active ? 'Deactivate' : 'Activate'}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                        </button>
                        <button onclick="ServiceManager.handleDeleteClick(${service.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    setupEventListeners: () => {
        document.getElementById('serviceSearch').addEventListener('input', () => ServiceManager.renderServiceTable());

        document.getElementById('newServiceForm').addEventListener('submit', ServiceManager.handleSaveService);

        // Image Preview Logic
        const imageInput = document.getElementById('serviceImageInput');
        const removeBtn = document.getElementById('removeImageBtn');

        imageInput?.addEventListener('change', function (e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('imagePreview').src = e.target.result;
                    document.getElementById('imagePreviewContainer').classList.remove('hidden');
                    document.getElementById('imagePlaceholder').classList.add('hidden');
                }
                reader.readAsDataURL(file);
            }
        });

        removeBtn?.addEventListener('click', function () {
            document.getElementById('serviceImageInput').value = '';
            document.getElementById('imagePreviewContainer').classList.add('hidden');
            document.getElementById('imagePlaceholder').classList.remove('hidden');
            document.getElementById('imagePreview').src = '';
        });
    },

    setupCategoryToggles: () => {
        const selectContainer = document.getElementById('categorySelectContainer');
        const inputContainer = document.getElementById('categoryInputContainer');
        const switchToInputBtn = document.getElementById('switchToInputBtn');
        const switchToSelectBtn = document.getElementById('switchToSelectBtn');

        if (switchToInputBtn) {
            switchToInputBtn.addEventListener('click', () => {
                selectContainer.classList.add('hidden');
                inputContainer.classList.remove('hidden');
                document.getElementById('categorySelect').value = ""; // reset selected
                document.getElementById('categoryInput').focus();
            });
        }

        if (switchToSelectBtn) {
            switchToSelectBtn.addEventListener('click', () => {
                inputContainer.classList.add('hidden');
                selectContainer.classList.remove('hidden');
                document.getElementById('categoryInput').value = ""; // reset input
            });
        }
    },

    // --- Actions ---

    handleEditClick: async (id) => {
        try {
            const res = await ManageServiceService.getServiceDetail(id);
            if (res.success) {
                const data = res.data;
                const service = data.serviceListResponse;

                const form = document.getElementById('newServiceForm');

                document.getElementById('serviceModalTitle').innerText = "Edit Service";
                document.getElementById('editServiceId').value = service.id;

                form.name.value = service.name;
                form.price.value = service.price;
                form.durationMinutes.value = service.durationMinutes;
                form.active.checked = service.active;
                form.description.value = service.description;

                // Handle Category Pre-fill
                const catSelect = document.getElementById('categorySelect');
                const catInput = document.getElementById('categoryInput');
                const selectContainer = document.getElementById('categorySelectContainer');
                const inputContainer = document.getElementById('categoryInputContainer');

                // Check if existing category is in the dropdown options
                const existsInOptions = Array.from(catSelect.options).some(opt => opt.value === service.category);

                if (existsInOptions) {
                    // Show Select
                    inputContainer.classList.add('hidden');
                    selectContainer.classList.remove('hidden');
                    catSelect.value = service.category;
                    catInput.value = "";
                } else {
                    // Show Input
                    selectContainer.classList.add('hidden');
                    inputContainer.classList.remove('hidden');
                    catInput.value = service.category;
                    catSelect.value = "";
                }

                // Handle Image Preview if URL exists
                if (service.imageUrl) {
                    document.getElementById('imagePreview').src = service.imageUrl;
                    document.getElementById('imagePreviewContainer').classList.remove('hidden');
                    document.getElementById('imagePlaceholder').classList.add('hidden');
                } else {
                    // Reset
                    document.getElementById('imagePreviewContainer').classList.add('hidden');
                    document.getElementById('imagePlaceholder').classList.remove('hidden');
                }

                ServiceUI.openModal('addServiceModal');
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to fetch details", "error");
        }
    },

    handleSaveService: async (e) => {
        e.preventDefault();

        // Show loading info
        const btn = document.querySelector('button[form="newServiceForm"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "Saving...";

        const formData = new FormData(e.target);
        const id = document.getElementById('editServiceId').value;
        const imageFile = formData.get('image');

        // Logic to get the chosen category
        const catSelect = document.getElementById('categorySelect');
        const catInput = document.getElementById('categoryInput');

        let chosenCategory = "";
        // If Logic: If input container is visible, use input. Else use select.
        if (!document.getElementById('categoryInputContainer').classList.contains('hidden')) {
            chosenCategory = catInput.value.trim();
        } else {
            chosenCategory = catSelect.value;
        }

        if (!chosenCategory) {
            showToast("Category is required", "error");
            btn.disabled = false;
            btn.innerText = originalText;
            return;
        }

        try {
            let res;
            if (id) {
                // UPDATE - JSON Only
                const updateJson = {
                    name: formData.get('name'),
                    category: chosenCategory,
                    price: parseFloat(formData.get('price')),
                    durationMinutes: parseInt(formData.get('durationMinutes')),
                    active: document.getElementById('serviceActive').checked,
                    description: formData.get('description')
                };

                res = await ManageServiceService.updateService(id, updateJson);

            } else {
                // CREATE - Multipart
                const createJson = {
                    name: formData.get('name'),
                    category: chosenCategory,
                    price: parseFloat(formData.get('price')),
                    durationMinutes: parseInt(formData.get('durationMinutes')),
                    active: document.getElementById('serviceActive').checked,
                    description: formData.get('description')
                };

                const apiData = new FormData();
                apiData.append('serviceDetails', new Blob([JSON.stringify(createJson)], { type: 'application/json' }));

                if (imageFile && imageFile.size > 0) {
                    apiData.append('image', imageFile);
                }

                res = await ManageServiceService.createService(apiData);
            }

            if (res.success) {
                showToast(res.message || "Saved successfully", "success");
                ServiceUI.closeModal('addServiceModal');
                ServiceManager.loadAllData();
            } else {
                showToast(res.message || "Failed to save", "error");
            }

        } catch (error) {
            console.error(error);
            showToast("An error occurred", "error");
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    handleToggleStatus: async (id) => {
        if (!confirm("Change service status?")) return;
        try {
            const res = await ManageServiceService.toggleServiceStatus(id);
            if (res.success) {
                showToast("Status updated", "success");
                ServiceManager.loadAllData(); // Refresh to show new status
            } else {
                showToast(res.message || "Failed to update status", "error");
            }
        } catch (error) {
            console.error(error);
        }
    },

    handleDeleteClick: async (id) => {
        if (!confirm("Are you sure you want to delete this service? This cannot be undone.")) return;
        try {
            const res = await ManageServiceService.deleteService(id);
            if (res.success) {
                showToast("Service deleted", "success");
                ServiceManager.loadAllData();
            } else {
                showToast(res.message || "Failed to delete", "error");
            }
        } catch (error) {
            console.error(error);
        }
    }
};

const ServiceUI = {
    openModal(id) {
        document.getElementById(id).classList.remove('hidden');
        document.body.classList.add('modal-active');

        if (id === 'addServiceModal' && !document.getElementById('editServiceId').value) {
            // New Service Mode - Reset form
            document.getElementById('newServiceForm').reset();
            document.getElementById('serviceModalTitle').innerText = "Add New Service";
            document.getElementById('imagePreviewContainer').classList.add('hidden');
            document.getElementById('imagePlaceholder').classList.remove('hidden');
            document.getElementById('imagePreview').src = '';

            // Reset Category UI to default (Select mode)
            document.getElementById('categoryInputContainer').classList.add('hidden');
            document.getElementById('categorySelectContainer').classList.remove('hidden');
        }
    },

    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
        document.body.classList.remove('modal-active');
        if (id === 'addServiceModal') {
            setTimeout(() => {
                document.getElementById('editServiceId').value = '';
                document.getElementById('newServiceForm').reset();
            }, 300);
        }
    }
};

window.ServiceUI = ServiceUI;
