import api from './axiosConfig';

export const tripApi = {
  getTrips: async () => {
    const response = await api.get('/api/trips');
    return response.data;
  },

  getTripById: async (id) => {
    const response = await api.get(`/api/trips/${id}`);
    return response.data;
  },

  createTrip: async (tripData) => {
    const response = await api.post('/api/trips', tripData);
    return response.data;
  },

  updateTrip: async (id, tripData) => {
    const response = await api.put(`/api/trips/${id}`, tripData);
    return response.data;
  },

  deleteTrip: async (id) => {
    const response = await api.delete(`/api/trips/${id}`);
    return response.data;
  },
};
