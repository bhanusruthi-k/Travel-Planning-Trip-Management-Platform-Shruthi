import api from './axiosConfig';

export const budgetApi = {
  getBudget: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/budget`);
    return response.data;
  },

  createBudget: async (tripId, budgetData) => {
    const response = await api.post(`/api/trips/${tripId}/budget`, budgetData);
    return response.data;
  },

  updateBudget: async (tripId, budgetData) => {
    const response = await api.put(`/api/trips/${tripId}/budget`, budgetData);
    return response.data;
  },

  deleteBudget: async (tripId) => {
    const response = await api.delete(`/api/trips/${tripId}/budget`);
    return response.data;
  },
};
