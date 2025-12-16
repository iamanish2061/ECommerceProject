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

    function getOtp(){
        return Array.from(otpInputs).map(input => input.value.trim()).join('');
    }

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
    findUsernameBtn.addEventListener('click',async()=>{
        const username = usernameInput.value.trim();

        if(!username){
            alert("Please enter your username");
            return;
        }

        //connect to backend
        try{
            const res = await fetch('/api/auth/username-exists?username='+encodeURIComponent(username),{
            method:'GET',
            headers:{ 'Content-Type':'application/json' },
            credentials : "include" //this is for accepting cookies tokens from backend httpServletresponse
        });
            const data = await res.json();

            if(!data.success){
                alert(data.messsage || "Username not found");
             }

        }catch(error){
            console.error("Error finding username");
            alert("Network error while checking username");
        }
        console.log("Button Clicked");
        alert("Accound Found! Proceeding to next step")
        showStep(2);
    });

    //step 2 verification code
    sendCodeBtn.addEventListener('click',async()=>{
        const username = usernameInput.value.trim();

        if(!username){
            alert('please enter username first');
            return;
        }
        try{
            const response = await fetch('/api/auth/send-otp-code-to-recover?username='+encodeURIComponent(username),{
                method:'GET',
                headers:{ 'Content-Type':'appication/json' },
                credentials:"include"
            });

            const data = await response.json();

            if(!data.success){
                alert(data.message || "Failed to send code")
            }
            alert("Code Sent successfully")
        }catch(error){
            console.error("Error in sending code");
            alert("Network error please check your internet");
        }

    });

    //otp behavaiour
    otpInputs.forEach((input, index) =>{
        input.addEventListener('input', ()=>{
            input.value = input.value.replace(/[^0-9]/g, '');

            if(input.value && index<otpInputs.length -1){
                otpInputs[index + 1].focus();
            }
            const code = getOtp();
            hiddenOtpInput.value = code;
        });

        input.addEventListener('keydown', (e) =>{
            if(e.key === 'Backspace' && !input.value && index>0){
                otpInputs[index - 1].focus();
            }
        });
    });

    //after clicking on verify code
    verifyCodeBtn.addEventListener('click',async()=>{
        const username = usernameInput.value.trim();
        const code = hiddenOtpInput.value.trim() || getOtp();

        if(!username){
            alert("please enter your username");
            return;
        }

        if(code.length !== otpInputs.length || !/^\d{6}$/.test(code)){
            alert("Please enter full code");
            return;
        }

        console.log("Final OTP ", code);

        try{
            const response = await fetch ('/api/auth/continue-without-login?username='+ encodeURIComponent(username) + "&code="+ encodeURIComponent(code),{
                method:'GET',
                headers:{ 'Content-Type':'application/json' },
                credentials: "include"
            });
            const data = await response.json();

            if(!data.success){
                alert(data.message || "Invalid Otp Code");
                return;
            }

        verifiedOtp = code;
            alert("Verification successfull");
            showStep(3);

        }catch(error){
            console.error("Error verifying code");
            alert("Failed to verify code");
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
            alert("please verify otp first");
        }

           alert("logging in...")
           window.location.href = "login.html";


    });

    //step4
    forgotForm.addEventListener('submit', async (e)=>{
        e.preventDefault();

        const usernameInp = usernameInput.value.trim();
        const pass = newPassInput.value.trim();
        const rePass = confirmPassInput.value.trim();

       const passwordRegex =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

        if(!pass || !rePass){
            alert("Please fill out both password fields")
            return;
        }
        if(!passwordRegex.test(pass)){
            alert("password must have a uppercase number and a speacial character");
            return;
        }

        if(pass !== rePass){
            alert("Please enter the same password");
            return;
        }

        const finalData = {
            username: usernameInp,
            code: verifiedOtp,
            password: pass,
            rePassword: rePass
        };



        try{
            const response = await fetch('/api/auth/update-password',{
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                credentials: 'include',
                body: JSON.stringify(finalData)
            });

            const data = await response.json();

            if(!data.success){
               alert(data.message || "Update Failed")
                return;
            }

            alert("Password changed successfully");
                window.location.href = "login.html"; //back to login page


        }catch(error){
            console.error("Error changing password: ", error);
            alert("Something went wrong while changing password please try again later");
        }


    });



});