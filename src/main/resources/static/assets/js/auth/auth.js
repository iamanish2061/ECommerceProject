//check auth status
function checkAuthStatus(){
    //check token in local storage
    const isLoggedIn = localStorage.getItem('accessToken') !== null;

    updateAuthUI(isLoggedIn);
}

//update buttons login logout

function updateAuthUI(isLoggedIn){
    const authBtn = document.getElementById('authBtn');
    const profileBtn = document.getElementById('profileBtn');

    if(!authBtn) return;

    if(isLoggedIn){
        authBtn.textContent = 'Logout'
        authBtn.classList.remove = 'border-blue-600 text-blue-600 hover:bg-blue-50';
        authBtn.classList.add = 'border-red-600 text-red-600 hover:bg-red-50';

        if(profileBtn) profileBtn.classList.remove('hidden');

        authBtn.onclick = handleLogout;

    }else{
        //if user logged in
        authBtn.textContent = 'Login'
        authBtn.classList.remove = 'border-red-600 text-red-600 hover:bg-red-50';
        authBtn.classList.add = 'border-blue-600 text-blue-600 hover:bg-blue-50';

        if(profileBtn) profileBtn.classList.add('hidden');

        authBtn.onclick = handleLogin;
    }
}

function handleLogin(){
    window.location.href = '/auth/login.html';
}

async function handleLogout(){
    if(confirm('Are you sure you want to logout?')){

        try{
            const response = await AuthService.logout();

            if(response?.success){
                updateAuthUI(false);
                showToast("Logging out...", "success");
                
                setTimeout(()=>window.location.href = '/auth/login.html', 1000);
            }else{
                showToast("Failed to logout", "error");
            }
        }catch(error){
            console.error("Network error failed to logout", error);
            showToast("Network Error", "error");
        }
    }
}

document.addEventListener('DOMContentLoaded', checkAuthStatus);