import api from './axiosConfig';

export const dashboardApi = {
  getTravelerDashboard: async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get('/api/dashboard/admin');
    return response.data;
  },

  getAdminExpenses: async () => {
    const response = await api.get('/api/dashboard/admin/expenses');
    return response.data;
  },
};

export default dashboardApi;
