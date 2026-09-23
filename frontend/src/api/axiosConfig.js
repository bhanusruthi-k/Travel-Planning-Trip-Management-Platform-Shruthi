import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('tripnest_token');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear token on 401 if not logging in
            if (!error.config.url.includes('/api/auth/login')) {
                localStorage.removeItem('tripnest_token');
                localStorage.removeItem('tripnest_user');
            }
        }

        return Promise.reject(error);
    }
);

export default api;