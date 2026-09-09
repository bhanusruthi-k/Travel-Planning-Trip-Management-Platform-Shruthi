import api from './axiosConfig';

export const userApi = {
  getProfile: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/users/me', data);
    return response.data;
  },

  updatePhoto: async (photoData) => {
    const response = await api.post('/api/users/me/photo', { photo: photoData });
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/api/users/change-password', data);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/api/users/me');
    return response.data;
  },
};
