function switchAddressTab(tab){
    const homeTab = document.getElementById('homeTab');
    const workTab = document.getElementById('workTab');
    const homeAddress = document.getElementById('homeAddress');
    const workAddress = document.getElementById('workAddress');
    
    if(tab === 'home'){
        homeTab.classList.remove('tab-inactive');
        homeTab.classList.add('tab-active');
        workTab.classList.add('tab-inactive');
        homeAddress.classList.remove('hidden');
        workAddress.classList.add('hidden');
    }else{
        workTab.classList.remove('tab-inactive');
        workTab.classList.add('tab-active');
        homeTab.classList.remove('tab-active');
        homeTab.classList.add('tab-inactive');
        workAddress.classList.remove('hidden');
        homeAddress.classList.add('hidden');
    }
}


//function to handle imageupload
function handleImageUpload(){}

//image preview funtction
function previewNewImage(){}

//save profile pic function
function saveProfilePicture(){}
//api will be here

//modal functions for the the profile picturees and other password modals

function openEditModal(){
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
}

function closeEditModal(){
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

function openPasswordModal(){
    document.getElementById('passwordModal').classList.remove('hidden');
    document.getElementById('passwordModal').classList.add('flex');

}
function closePasswordModal(){
    document.getElementById('passwordModal').classList.remove('flex');
    document.getElementById('passwordModal').classList.add('hidden');
}

function openAddressModal(type = 'home'){
    document.getElementById('addressType').value = type;
    document.getElementById('addressModal').classList.remove('hidden');
    document.getElementById('addressModal').classList.add('flex');
}
function closeAddressModal(){
    document.getElementById('addressModal').classList.add('hidden');
    document.getElementById('addressModal').classList.remove('flex');
}


//change password function
function changePassword(){
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confrimPassword').value;

    if(!current || !newPass || !confirm){
        showToast("Please fill all the fields", "info");
        return;
    }

    if(newPass !== confirm){
        showToast("Passwords do not match", "error");
    }

    //here we send req to api
    ////////////////////

    closePasswordModal();
    showToast("password updated successfully");
}

//save address function
function saveAddress(){
    const type = document.getElementById('addressType').value;
    const address = document.getElementById('addressFull').value;
    const phone = document.getElementById('addressPhone').value;

    if(!address || !phone){
        showToast("Pleae fill all the fields", "info");
    }

    //here we againsend req to api    // also fix the address this is just a dummy address
    /////////////////////

    closeAddressModal();
    showToast("Address saved successfully", "success");
}

//edit address functionality not confirmed yet


//Order functions


function viewAllOrders(){
    //todo: navigate to allOrder page
    showToast("Going to order details", "info");
}


function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel order ' + orderId + '?')) {
        // todo: Send cancel request to API
        showToast('Order cancellation request sent!', 'info');
    }
}

//tracking order
function trackOrder(orderId){}

//viewnig details ofsingle order can be addded not neccessary
function viewOrderDetails(){}


//logout function  use the previous function
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


// PAGE LOAD INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    //todo: Load user profile data
    //todo: Load addresses
    //todo: Load orders
    console.log('Profile page loaded');
});





