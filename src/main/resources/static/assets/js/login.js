document.addEventListener('DOMContentLoaded',()=>{

//tab switching login
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form');

function showForm(type){
    forms.forEach(form=>{
        form.classList.toggle('active',form.id === `${type}-form`);
    });

    tabs.forEach(tab=>{
        tab.classList.toggle('active',tabataset.target === type);

    });

    const heroHeading = document.querySelector('.hero-title h1');
    heroHeading.textContent = type === 'login' ? 'Welcome Back!' : 'Welcome Aboard!';
}

tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{showForm(tab.dataset.target)});
});


// Function to handle the toggle logic for password field
function setupPasswordToggle(passwordInputId) {
    const passwordInput = document.getElementById(passwordInputId);

    if (!passwordInput) return;


    const fieldContainer = passwordInput.closest('.field');
    if (!fieldContainer) return;


    const eyeClose = fieldContainer.querySelector('.eye-icon.closed');
    const eyeOpen = fieldContainer.querySelector('.eye-icon.open');

    if (eyeClose && eyeOpen) {

        eyeClose.addEventListener('click', () => {
            passwordInput.type = 'text';
            eyeClose.classList.remove('active');
            eyeOpen.classList.add('active');
        });

        // Listener for the SHOW icon (bx-show)
        eyeOpen.addEventListener('click', () => {
            passwordInput.type = 'password';
            eyeClose.classList.add('active');
            eyeOpen.classList.remove('active');
        });
    }
}


setupPasswordToggle('password'); // Login Password
setupPasswordToggle('signup-password'); // Signup Password
setupPasswordToggle('confirm-password'); // Signup Confirm Password



//toast function
function showToast(message,type="info", duration = 3000){
    const toastContainer = document.getElementById('toast-container');
    if(!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(()=>{
        toast.remove();
    },duration);
}


//login submission login
const usernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');

loginBtn.addEventListener('click', async ()=>{
  const username = usernameInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if(!username){
        showToast("please enter your username","error");
        return;
    }
    if(!validateUsername(usernameInput)){
        return;
    }
    if(!password){
        showToast("Please enter your password","error");
        return
    }
    if(!validatePassword(loginPasswordInput)){
        return;
    }
    const loginData ={
        username: username,
        password: password
    };
    loginBtn.disabled = true;
    loginBtn.innerHTML = `<span>Logging in...</span>`;

    try{
        const response = await fetch("/api/auth/login",{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(loginData),
            credentials: "include"
        });
        const data = await response.json();
        if(data.success){
            showToast("Login successful! Redirecting...", "success");
            window.location.href = "/product.html"
        }else{
            showToast(data.message || "Login failed, please try again.", "error");
        }
    }catch(error){
        console.error("Login error: ", error);
        showToast("Network error please try again later", "error");
    }finally{
        loginBtn.disabled = false;
        loginBtn.innerHTML = `<span>Login</span>`;
    }

});






// Multi step signup logic

const signupForm = document.getElementById('signup-form');
const steps = signupForm.querySelectorAll('.step');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

//getting values
const fullNameInput = document.getElementById('full-name');
const userNameInput = document.getElementById('create-username');
const emailInput = document.getElementById('email');
const otpInputs = document.querySelectorAll('.otp-input');
const hiddenOtpInput = document.getElementById('hidden-otp');
const passwordInput = document.getElementById('signup-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const sendCodeBtn = document.getElementById('send-code');

let currentStep = 1;
let isOtpVerified = false;

function showStep(n){
    steps.forEach((step, index)=>{
        step.classList.toggle('active', index + 1 == n);
    });
    currentStep = n;

    prevBtn.style.display = n == 1? 'none' : 'flex';

    if(n === 3){
        nextBtn.innerHTML = `<span>Create Account</span>` ;
    }else if(n === 2){
        nextBtn.innerHTML = `<span>Verify</span><i class ='bx bx-right-arrow-alt'></i>` ;
    }else{
        nextBtn.innerHTML = `<span>Next</span><i class='bx bx-right-arrow-alt'></i>`;
    }
}

//sending code
sendCodeBtn.addEventListener("click", async () => {

    //  yo chai client side validation so checks if regex match garxa ki nai
    if (!validateEmail(emailInput)) {
        return;
    }



    //ui ko lagi
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = "Sending....";

    try {
        //fetching otp using email
        const response = await fetch("/api/auth/send-otp-code?email="+emailInput.value.trim(), {
            method: "GET",
            headers: {"Content-Type" : "application/json"}
        });
        const data = await response.json();

        // showing error if email register xa vaye
        if (!data.success) {

            showToast(data.message || "Email already registered or failed to send code.", "error");


            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = "Send Code";

        } else {

            showToast(data.message || "OTP code sent successfully","success");


            startResendTimer();
        }
        //yo catch for handling network error
    } catch (error) {

        console.error("Network error:", error);
        showToast("Network error, please check your connection.", "error");


        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = "Send Code";
    }
});


// Multi step NEXT button logic
nextBtn.addEventListener('click', async () =>{

    // first ma check username availability and regex
    if(currentStep === 1){

        if(!validateFullName(fullNameInput)){
            return;
        }

        // regex check garxa
        if (!validateUsername(userNameInput)) {
            return; // Stop if validation failed
        }

        // 2. Check userrname available xa ki nai
        const res = await fetch("/api/auth/username-availability?username="+userNameInput.value.trim(),{
            method: "GET",
            headers: {"Content-Type": "application/json"},
        });
        const data = await res.json();

        if(!data.success){
           showToast("Username already taken","info");
            return;
        }else{
            alert(data.message || "Username is available.");
            setTimeout(()=>{
                showStep(2);
            }, 2000)
        }
    }


    // Step 2: Verify OTP
    if(currentStep === 2){


        // 1. OTP format verification (Local)
        const enteredOtp = document.getElementById('hidden-otp').value.trim();
        const emailValue = document.getElementById('email').value.trim();

        if(emailValue.length === 0){
            return;
        }

        if(enteredOtp.length !==6 || !/^\d{6}$/.test(enteredOtp)){
            showToast("Please enter full 6 digit-code","error");
            otpInputs.forEach(box => box.style.borderColor = '#dc3545'); // red border
            return;
        }
        //creating a request body
        const verificationData ={
            email: emailValue,
            code: enteredOtp
        };


        nextBtn.disabled = true;
        nextBtn.innerHTML = `<span>Verifying...</span>`;

        try{
            const response = await fetch("/api/auth/verify-otp-code", {
                method: "POST",
                headers : {"Content-Type" : "application/json"},
                body: JSON.stringify(verificationData)
            });
            const result = await response.json();

            if(result.success){
                isOtpVerified = true;
                showStep(3);
            }else{
                showToast(result.message || "Invalid or expired code","error");
                isOtpVerified = false;
            }
        }catch(error){
            console.error(error);
            showToast("Verification failed. Check your connection", "error");
            otpInputs.forEach(box => box.style.borderColor = '#dc3545'); // red border
        }finally{
            nextBtn.disabled = false;
            nextBtn.innerHTML = `<span>Verify</span><i class = 'bx bx-right-arrow-alt'></i>`;
        }
    }

    // Final Submission
    if(currentStep === 3){
         const enteredOtp = document.getElementById('hidden-otp').value.trim();
        // Final Client-side Validation
        if (!validateFullName(fullNameInput) ||
            !validatePassword(passwordInput) ||
            !validateConfirmPassword(passwordInput, confirmPasswordInput)) {
            return;
        }

        if(!isOtpVerified){
            showToast("Please verify your email first!", "info");
            showStep(2);
            return;
        }

        const finalData = {
            fullname : fullNameInput.value.trim(),
            username : userNameInput.value.trim(),
            email : emailInput.value.trim(),
            code:enteredOtp,
            password:passwordInput.value.trim(),
            rePassword : passwordInput.value.trim()
        };

        nextBtn.disabled = true;
        nextBtn.innerHTML = `<span>Creating Account...</span>`;

        try{
            //  Registration API Call
            const response = await fetch("/api/auth/register", {
                method : "POST",
                headers : {"Content-Type" : "application/json"},
                body : JSON.stringify(finalData)
            });
            const result = await response.json();

            if(result.success){
                showToast("Account created successfully", "success");
                showForm('login');
            }else{
                showToast(result.message || "Registration failed please try again", "error");
            }
        }catch(error){
            console.error("Registration error: ",error);
            showToast("Network error please try again later", "error");
        }finally{
            nextBtn.disabled = false;
            nextBtn.innerHTML = `<span>Create Account</span>`;
        }
    }
});


// Resend Timer logic
const startResendTimer = () => {

    let time = 60;
    sendCodeBtn.textContent = `Resend in ${time}s`;
    sendCodeBtn.disabled = true;
    const timer = setInterval(()=>{
        time--;

        if(time <= 0){
            clearInterval(timer);
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = "Send Code";
        }else{
            sendCodeBtn.textContent =  `Resend in ${time}s`;
        }
    }, 1000);
};


otpInputs.forEach((input,index)=>{

    input.addEventListener('input',()=>{
        input.value = input.value.replace(/\D/g,'').slice(0,1);
        if(input.value && index < otpInputs.length - 1){
            otpInputs[index + 1].focus();
        }
        hiddenOtpInput.value = Array.from(otpInputs).map(i=>i.value).join('');

        if(hiddenOtpInput.value.length === 6){
            if(/^\d{6}$/.test(hiddenOtpInput.value)){
                otpInputs.forEach(box=> box.style.borderColor = '#28a745');
            }else{
                otpInputs.forEach(box=> box.style.borderColor = '#dc3545');
            }
        }
    });

    input.addEventListener('keydown',(e)=>{
        if(e.key ==='Backspace' && !input.value && index>0){
            otpInputs[index -1 ].focus();
        }
    });

    input.addEventListener('paste', e => {
        const paste = (e.clipboardData.getData('text')||'').replace(/\D/g,'');
        if(paste.length >= 6){
            otpInputs.forEach((inp,i)=> inp.value = paste[i]||'');
            hiddenOtpInput.value = paste.slice(0,6);
            otpInputs[5].focus();
            e.preventDefault();
        }
    });
});

prevBtn.addEventListener('click', ()=>{
    if(currentStep>1){
        showStep(currentStep-1);
    }
});

// Initialize
showStep(1);

});