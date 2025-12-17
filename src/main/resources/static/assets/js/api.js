const BASE_URL = '/api';

async function request(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('accessToken');
    const tokenType = localStorage.getItem('tokenType');

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `${tokenType} ${token}`;

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include' 
        });

        const data = await response.json();

        if (!data.success && data.errorCode === "TOKEN_EXPIRED") {
            // hit refresh endpoint, browser sends HttpOnly cookie automatically
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // IMPORTANT: include cookies
            });

            const refreshData = await refreshRes.json();

            if (refreshData.success) {
                // save new access token in localStorage
                localStorage.setItem('accessToken', refreshData.data.accessToken);
                localStorage.setItem('tokenType', refreshData.data.tokenType);

                // retry original request with new access token
                headers.Authorization = `${refreshData.data.tokenType} ${refreshData.data.accessToken}`;
                const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    credentials: 'include'
                });
                let retryData = await retryRes.json();
                return { ...retryData, httpStatus: retryRes.status };
            } else {
                // refresh failed → logout
                AuthService.logout();
                return {
                    success: false,
                    message: 'Session expired. Please login again.',
                    httpStatus: 401,
                    errorCode: 'TOKEN_EXPIRED'
                };
            }
        }

        return { ...data, httpStatus: response.status }; 
    } catch {
        return { success: false, message: 'Network error. Please try again later.' };
    }
}

