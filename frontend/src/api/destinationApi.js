import api from './axiosConfig';

export const destinationApi = {
  getDestinations: async () => {
    const response = await api.get('/api/destinations');
    return response.data;
  },

  getPopularDestinations: async () => {
    const response = await api.get('/api/destinations/popular');
    return response.data;
  },

  getDestinationById: async (id) => {
    const response = await api.get(`/api/destinations/${id}`);
    return response.data;
  },

  getDestinationWeather: async (id) => {
    const response = await api.get(`/api/destinations/${id}/weather`);
    return response.data;
  },

  getDestinationPlaces: async (id) => {
    const response = await api.get(`/api/destinations/${id}/places`);
    return response.data;
  },

  createDestination: async (data) => {
    const response = await api.post('/api/destinations', data);
    return response.data;
  },
};
