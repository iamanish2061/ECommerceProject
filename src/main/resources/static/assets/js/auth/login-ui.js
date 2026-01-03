document.addEventListener('DOMContentLoaded', () => {
    //tab switching login
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form');

    function showForm(type){
        forms.forEach(form=>{
            form.classList.toggle('active',form.id === `${type}-form`);
        });

        tabs.forEach(tab=>{
            tab.classList.toggle('active',tab.dataset.target === type);

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


    setupPasswordToggle('login-password'); // Login Password
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


    // --- LOGIN SUBMISSION ---
    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        // Validation (for empty fields)
        if (!username) return showToast("Please enter your username!", "error");
        if (!password) return showToast("Please enter your password!", "error");

        // validation (format checks)
        if(!validateUsername(usernameInput)) return;
        if(!validatePassword(passwordInput)) return;

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";

            const result = await AuthService.login({ username, password });
            if(!result.success){
                showToast(result.message || "Login failed", 'error');
                return;
            }
            showToast(result.message || 'Login successful!', 'success');
            setTimeout(() => window.location.href = result.data.redirectionPage, 1000);
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
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
            nextBtn.textContent = `<span>Create Account</span>` ;
        }else if(n === 2){
            nextBtn.innerHTML = `<span>Verify</span><i class ='bx bx-right-arrow-alt'></i>` ;
        }else{
            nextBtn.innerHTML = `<span>Next</span><i class='bx bx-right-arrow-alt'></i>`;
        }
    }


    // Multi step NEXT button logic
    nextBtn.addEventListener('click', async () =>{

        // first ma check username availability and regex
        if(currentStep === 1){
            // regex check garxa of fullname and username
            if(!validateFullName(fullNameInput)) return;
            if (!validateUsername(userNameInput)) return;

            // 2. Check username available xa ki nai
            try{
                const username = userNameInput.value.trim();
                const result = await AuthService.checkUsername(username);
                if(!result.success){
                    showToast(result.message ||"Username already taken","info");
                    return;
                }
                setTimeout(()=>showStep(2), 500);
            }catch(error){
                showToast(error.message, "error");
            } 
        }
    
        // Step 2: Verify OTP
        if(currentStep === 2){

            if(!validateEmail(emailInput)) return;
  
            // 1. OTP format verification (Local)
            const code = hiddenOtpInput.value.trim();
            const email = emailInput.value.trim();

            if(email.length === 0){
                showToast("Please enter your email first","error");
                return;
            }
            if(code.length !==6 || !/^\d{6}$/.test(code)){
                showToast("Please enter full 6 digit-code","error");
                otpInputs.forEach(box => box.style.borderColor = '#dc3545'); // red border
                return;
            }
            
            try{
                nextBtn.disabled = true;
                nextBtn.textContent = "Verifying...";

                const resultofVerifyingOtp = await AuthService.verifyOtp({ email, code });
                if(!resultofVerifyingOtp.success){
                    showToast(resultofVerifyingOtp.message || "Invalid or expired code","error");
                    isOtpVerified = false;
                    return;
                }

                showToast(resultofVerifyingOtp.message || "Email verified successfully","success");
                isOtpVerified = true;
                setTimeout(()=>showStep(3), 500);
                
            }catch(error){
                showToast(error.message || "Verification failed. Check your connection", "error");
                otpInputs.forEach(box => box.style.borderColor = '#dc3545'); // red border
            }finally{
                nextBtn.disabled = false;
                nextBtn.innerHTML = `<span>Verify</span><i class = 'bx bx-right-arrow-alt'></i>`;
            }
        }

        // Final Submission
        if(currentStep === 3){
            const enteredOtp = hiddenOtpInput.value.trim();
            // Final Client-side Validation
            if (!validateFullName(fullNameInput) ||
                !validatePassword(passwordInput) ||
                !validateEmail(emailInput) ||
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
                rePassword : confirmPasswordInput.value.trim()
            };
            
            try{
                nextBtn.disabled = true;
                nextBtn.textContent = "Creating Account...";
                //  Registration API Call
                const resultOfSignup = await AuthService.register(finalData);
                if(!resultOfSignup.success){
                    showToast(resultOfSignup.message || "Registration failed please try again", "error");
                    return;
                }

                showToast(resultOfSignup.message || "Account created successfully", "success");
                setTimeout(()=> window.location.href = resultOfSignup.data.redirectionPage, 500);
            }catch(error){
                console.error("Registration error: ",error);
                showToast("Network error please try again later", "error");
            }finally{
                nextBtn.disabled = false;
                nextBtn.innerHTML = `<span>Create Account</span>`;
            }
        }
    });


    //sending code
    sendCodeBtn.addEventListener("click", async () => {
        //  yo chai client side validation so checks if regex match garxa ki nai
        if (!validateEmail(emailInput)) return;
        //ui ko lagi
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = "Sending....";
        try {
            let email = emailInput.value.trim();
            //fetching otp using email
            const resultOfSendingOtp = await AuthService.sendOtp(email)
            if(!resultOfSendingOtp.success){
                showToast(resultOfSendingOtp.message || "Email already registered or failed to send code.", "error");
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = "Send Code";
                return;
            }
            showToast(resultOfSendingOtp.message || "OTP code sent successfully","success");
            startResendTimer();
        } catch (error) {
            console.error("Network error:", error);
            showToast("Network error, please check your connection.", "error");
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = "Send Code";
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