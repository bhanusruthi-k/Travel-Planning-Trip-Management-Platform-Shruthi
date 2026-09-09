import api from './axiosConfig';

export const destinationApi = {
  getDestinations: async (params = {}) => {
    try {
      const response = await api.get('/api/destinations', { params });
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
      } else if (response.data && Array.isArray(response.data.destinations)) {
        return response.data.destinations;
      }
      return [];
    } catch (error) {
      console.error('[destinationApi] Failed to fetch destinations:', {
        url: '/api/destinations',
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      throw error;
    }
  },

  getPopularDestinations: async () => {
    try {
      const response = await api.get('/api/destinations/popular');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[destinationApi] Failed to fetch popular destinations:', error);
      throw error;
    }
  },

  getDestinationById: async (id) => {
    try {
      const response = await api.get(`/api/destinations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[destinationApi] Failed to fetch destination ${id}:`, error);
      throw error;
    }
  },

  getDestinationWeather: async (id) => {
    try {
      const response = await api.get(`/api/destinations/${id}/weather`);
      return response.data;
    } catch (error) {
      console.error(`[destinationApi] Failed to fetch weather for ${id}:`, error);
      throw error;
    }
  },

  getDestinationPlaces: async (id) => {
    try {
      const response = await api.get(`/api/destinations/${id}/places`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`[destinationApi] Failed to fetch places for ${id}:`, error);
      throw error;
    }
  },

  getDestinationAttractions: async (id) => {
    try {
      const response = await api.get(`/api/destinations/${id}/attractions`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`[destinationApi] Failed to fetch attractions for ${id}:`, error);
      throw error;
    }
  },

  searchDestinations: async (name) => {
    try {
      const response = await api.get('/api/destinations/search', { params: { name } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`[destinationApi] Failed to search destinations for ${name}:`, error);
      throw error;
    }
  },

  createDestination: async (data) => {
    const response = await api.post('/api/destinations', data);
    return response.data;
  },

  updateDestination: async (id, data) => {
    const response = await api.put(`/api/destinations/${id}`, data);
    return response.data;
  },

  deleteDestination: async (id) => {
    const response = await api.delete(`/api/destinations/${id}`);
    return response.data;
  },
};
