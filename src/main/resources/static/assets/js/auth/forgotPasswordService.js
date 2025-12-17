const ForgotPasswordService = {

    async doesUsernameExist(username){
        return await request(`/auth/username-exists?username=${encodeURIComponent(username)}`, 'GET');
    },
    
    async sendOtpCodeToRecover(username){
        return await request(`/auth/send-otp-code-to-recover?username=${encodeURIComponent(username)}`, 'GET');
    },

    async verifyOtpCodeForRecovery(credentials){
        return await request('/auth/verify-otp-code-from-username', 'POST', credentials);
    },

    async continueWithoutPasswordReset(credentials){
        const res = await request('/auth/continue-without-password-reset', 'POST', credentials);
        if(res?.success) AuthService.saveSession(res.data);
        return res;
    },

    async updatePassword(credentials){
        const res = await request('/auth/update-password', 'PUT', credentials);
        if(res?.success) AuthService.saveSession(res.data);
        return res;
    }

}