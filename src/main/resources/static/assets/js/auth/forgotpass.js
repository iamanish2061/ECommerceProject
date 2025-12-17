document.addEventListener('DOMContentLoaded', ()=>{
    const forgotForm = document.getElementById('forgot-form');
    const steps = document.querySelectorAll('.step');

    const findUsernameBtn = document.getElementById('find-username');
    const sendCodeBtn = document.getElementById('link-btn');
    const verifyCodeBtn = document.getElementById('verify-code');
    const yesBtn = document.getElementById('change-password-yes');
    const noBtn = document.getElementById('change-password-no');

    const usernameInput = document.getElementById('username');
    const otpInputs = document.querySelectorAll('.otp-input');
    const hiddenOtpInput = document.getElementById("verification-code");

    const newPassInput = document.getElementById('new-password');
    const confirmPassInput = document.getElementById('confirm-password');

    const passwordFields = document.querySelectorAll('.pass');
    const eyeClose = document.querySelector('.eye-icon.closed');
    const eyeOpen = document.querySelector('.eye-icon.open');


    eyeClose.addEventListener('click', ()=>{
       passwordFields.forEach(field=>{
            field.type='text';
       });
       eyeClose.classList.remove('active');
       eyeOpen.classList.add('active');
    });

    eyeOpen.addEventListener('click', ()=>{
        passwordFields.forEach(field=>{
            field.type='password';
        });
        eyeClose.classList.add('active')
        eyeOpen.classList.remove('active');
    });

    let verifiedOtp = ""; //storing otp after verification

    const STEP_MESSAGES = {
        1: "Recover Your Account",
        2: "Verification",
        3: "Change Password ?",
        4: "Create Password"
    };

    //helper functions
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

    // function getOtp(){
    //     return Array.from(otpInputs).map(input => input.value.trim()).join('');
    // }

    function showStep(n){
        steps.forEach((step, index)=>{
            const isCurrent = index + 1 === n;
            step.style.display = isCurrent ? 'block' : 'none';
        });
        currentStep = n;
        updateWelcomeMsg(n);
    }

    function updateWelcomeMsg(step){
        const heroHeading = document.querySelector('.hero-title h2');
        if(heroHeading && STEP_MESSAGES[step]){
            heroHeading.textContent = STEP_MESSAGES[step];
        }
    }
    showStep(1);


    //step 1 check if the username exists
    findUsernameBtn.addEventListener('click', async()=>{
        const username = usernameInput.value.trim();

        if(!username){
            showToast("Please enter your username","error");
            return;
        }
        if(!validateUsername(usernameInput)){
            return;
        }

        //connect to backend
        try{
            const res = await ForgotPasswordService.doesUsernameExist(username);
            if(!res.success){
                showToast(res.message || "Username not found", "error");
                return;
            }
            document.getElementById('generatedEmail').textContent = `Do you want to send Verification code to : ${res.data}`;
            setTimeout(()=>showStep(2), 500);

        }catch(error){
            console.error("Error finding username");
            showToast("Network error while checking username", "error");
        }

    });

    //step 2 verification code
    sendCodeBtn.addEventListener('click',async()=>{
        const username = usernameInput.value.trim();

        if(!username){
            showToast('please enter username first',"error");
            return;
        }
        if(!validateUsername(usernameInput)){
            return;
        }

        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = "Sending...";

        try{
            const response = await ForgotPasswordService.sendOtpCodeToRecover(username);
            if(!response.success){
                showToast(response.message || "Failed to send code", "error");
                return;
            }
            showToast("Code Sent successfully","success");
        }catch(error){
            console.error("Error in sending code");
            showToast("Network error please check your internet","error");
        }finally{
            sendCodeBtn.disabled = false;
            sendCodeBtn.innerHTML = `<span>Send Code</span>`;
        }

    });

    //otp behavaiour
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

    //after clicking on verify code
    verifyCodeBtn.addEventListener('click', async()=>{
        const username = usernameInput.value.trim();
        const code = hiddenOtpInput.value.trim();

        if(!username){
            showToast("please enter your username","error");
            return;
        }
        if(!validateUsername(usernameInput)){
            return;
        }

        if(code.length !== otpInputs.length || !/^\d{6}$/.test(code)){
            showToast("Please enter full code", "error");
            return;
        }

        try{
            const response = await ForgotPasswordService.verifyOtpCodeForRecovery({ username, code });
            if(!response.success){
                showToast(response.message || "Invalid Otp Code", "error");
                return;
            }
            verifiedOtp = code;
            showToast("Verification successful","success");
            setTimeout(() => showStep(3), 500);

        }catch(error){
            console.error("Error verifying code");
            showToast("Failed to verify code","error");
        }
    });

    //step 3 for yes no
    //if user chooses yes
    yesBtn.addEventListener('click', ()=>{
        showStep(4)
    })
    //if user chooses no
    noBtn.addEventListener('click', async ()=>{
        if(!verifiedOtp){
            showToast("please verify otp first","error");
        }

        const username = usernameInput.value.trim();
        const code = hiddenOtpInput.value.trim();

        if(!username){
            showToast("please enter your username","error");
            return;
        }
        if(!validateUsername(usernameInput)){
            return;
        }

        if(code.length !== otpInputs.length || !/^\d{6}$/.test(code)){
            showToast("Please enter full code", "error");
            return;
        }

        try{
            const response = await ForgotPasswordService.continueWithoutPasswordReset({ username, code });
            if(!response.success){
                showToast(response.message || "Error! Please try again", "error");
                return;
            }

            showToast("Please Wait...", "info");
            setTimeout(() => {
                window.location.href = "/product.html"
            }, 500);
        }catch(error){
            console.error("Error continuing without password reset");
            showToast("Network error please try again later","error");
        }
    });

    //step4
    forgotForm.addEventListener('submit', async (e)=>{
        e.preventDefault();

        const username = usernameInput.value.trim();
        const code = hiddenOtpInput.value.trim();
        const password = newPassInput.value.trim();
        const rePassword = confirmPassInput.value.trim();

        if(!username){
            showToast("Please enter your username","error");
            return;
        }
        if(!validateUsername(usernameInput)){
            return;
        }
        if(code.length !== otpInputs.length || !/^\d{6}$/.test(code)){
            showToast("Please enter full code", "error");
            return;
        }
        if(!password || !rePassword){
            showToast("Please fill out both password fields","error");
            return;
        }   
        if(!validatePassword(newPassInput)){
            return;
        }

        if(password !== rePassword){
            showToast("Please enter the same password","error");
            return;
        }
        
        try{
            const response = await ForgotPasswordService.updatePassword({ username, code, password, rePassword });
            if(!response.success){
               showToast(response.message || "Update Failed", "error");
                return;
            }
            showToast("Password changed successfully", "success");
            setTimeout(() => window.location.href = "/product.html", 500);
        }catch(error){
            console.error("Error changing password: ", error);
            showToast("Something went wrong please try again later","error");
        }

    });

});