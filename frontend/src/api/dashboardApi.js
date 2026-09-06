import api from './axiosConfig';

export const dashboardApi = {
  getTravelerDashboard: async () => {
    const response = await api.get('/api/dashboard/traveler');
    return response.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get('/api/dashboard/admin');
    return response.data;
  },
};
