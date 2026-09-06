import api from './axiosConfig';

export const expenseApi = {
  // Get all expenses for a trip
  getExpenses: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/expenses`);
    return response.data;
  },

  // Get single expense
  getExpense: async (tripId, expenseId) => {
    const response = await api.get(`/api/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },

  // Create new expense
  createExpense: async (tripId, expenseData) => {
    const response = await api.post(`/api/trips/${tripId}/expenses`, expenseData);
    return response.data;
  },

  // Update existing expense
  updateExpense: async (tripId, expenseId, expenseData) => {
    const response = await api.put(`/api/trips/${tripId}/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (tripId, expenseId) => {
    const response = await api.delete(`/api/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },

  // Get category spend summary
  getCategorySummary: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/expenses/category-summary`);
    return response.data;
  },

  // Get remaining budget and overall expense summary
  getRemainingBudget: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/expenses/remaining-budget`);
    return response.data;
  },
};

export default expenseApi;
