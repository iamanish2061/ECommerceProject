function initNavbar() {
    setupAuthState();
    setupEventListeners();
}

function setupAuthState() {
    const isLoggedIn = localStorage.getItem('accessToken') !== null;
    updateAuthUI(isLoggedIn);
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

function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogin() {
    window.location.href = '/auth/login.html';
}

async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        // Try to call logout API if AuthService exists
        if (typeof AuthService !== 'undefined' && AuthService.logout) {
            const response = await AuthService.logout();
            if (response?.success) {
                updateAuthUI(false);
                showToast('Logged out successfully', 'success');
                setTimeout(() => {
                        window.location.href = '/auth/login.html';
                    }, 500);
            } else {
                showToast('Failed to log out', 'error');
            }
        } else {
            console.log("auth service not defined");
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
});




