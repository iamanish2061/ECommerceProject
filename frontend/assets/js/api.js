const BASE_URL = '/api';

async function request(endpoint, method = 'GET', body = null, options = {}) {
    const token = localStorage.getItem('accessToken');
    const tokenType = localStorage.getItem('tokenType');

    const headers = {};
    const isMultipart = (body instanceof FormData) || options.isMultiPart;

    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) headers.Authorization = `${tokenType} ${token}`;

    const fetchOptions = {
        method,
        headers,
        credentials: 'include'
    };

    if (body) {
        fetchOptions.body = isMultipart ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

        const data = await response.json();

        if (!data.success && data.errorCode === "TOKEN_EXPIRED") {
            // hit refresh endpoint
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            const refreshData = await refreshRes.json();

            if (refreshData.success) {
                // save new access token
                localStorage.setItem('accessToken', refreshData.data.accessToken);
                localStorage.setItem('tokenType', refreshData.data.tokenType);

                // Update auth header
                headers.Authorization = `${refreshData.data.tokenType} ${refreshData.data.accessToken}`;

                // Retry original request
                // Note: fetchOptions already has the correct body (FormData or stringified JSON)
                // We just need to update headers
                fetchOptions.headers = headers;

                const retryRes = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
                let retryData = await retryRes.json();
                return { ...retryData, httpStatus: retryRes.status };
            } else {
                // refresh failed → logout
                AuthService.clearLocalStorage();
                return {
                    success: false,
                    message: 'Session expired. Please login again.',
                    httpStatus: 401,
                    errorCode: 'TOKEN_EXPIRED'
                };
            }
        }

        return { ...data, httpStatus: response.status };
    } catch (error) {
        console.error("API Request Error:", error);
        return { success: false, message: 'Network error. Please try again later.' };
    }
}