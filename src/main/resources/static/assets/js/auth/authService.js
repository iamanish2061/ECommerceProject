const AuthService = {
    async login(credentials) {
        const res = await request('/auth/login', 'POST', credentials);
        if (res?.success) this.saveSession(res.data);
        return res;
    },

    async register(userData) {
        const response = await request('/auth/register', 'POST', userData);
        if(response?.success) this.saveSession(response.data);
        return response;
    },

    async checkUsername(username) {
        return await request(`/auth/username-availability?username=${encodeURIComponent(username)}`, 'GET');
    },

    async sendOtp(email) {
        return await request(`/auth/send-otp-code?email=${encodeURIComponent(email)}`, 'GET');
    },

    async verifyOtp(credentials){
        return await request('/auth/verify-otp-code', 'POST', credentials);
    },

    saveSession(data) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('tokenType', data.tokenType);
        const userProfile = {
            userId: data.userId,
            fullName: data.fullName,
            username: data.username,
            email: data.email,
            role: data.role
        };
        localStorage.setItem('user', JSON.stringify(userProfile));
    },

    isAuthenticated(){
        return localStorage.getItem('accessToken') !== null;
    },


    async logout() {
        const response = await request('/auth/logout', 'POST');
        if(response?.success) this.clearLocalStorage();
        return response;
    },

    clearLocalStorage() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
    },

    async showProductDetails(productId){
     return await request(`/api/products/{productId}`, 'GET');
    }



};