import api from './axiosConfig';

export const authApi = {
  login: async (email, password, expectedRole = null) => {
    const payload = { email, password };
    if (expectedRole) {
      payload.expectedRole = expectedRole;
    }
    const response = await api.post('/api/auth/login', payload);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  registerAdmin: async (userData) => {
    const response = await api.post('/api/auth/register-admin', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/api/auth/account');
    return response.data;
  },
};

