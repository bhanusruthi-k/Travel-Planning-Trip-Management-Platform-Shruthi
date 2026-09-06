import api from './axiosConfig';

export const itineraryApi = {
  getItineraryForTrip: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/itinerary-days`);
    return response.data;
  },

  addDay: async (tripId, data) => {
    const response = await api.post(`/api/trips/${tripId}/itinerary-days`, data);
    return response.data;
  },

  deleteDay: async (tripId, dayId) => {
    const response = await api.delete(`/api/trips/${tripId}/itinerary-days/${dayId}`);
    return response.data;
  },

  addActivity: async (dayId, data) => {
    const response = await api.post(`/api/trips/itinerary-days/${dayId}/activities`, data);
    return response.data;
  },

  updateActivity: async (activityId, data) => {
    const response = await api.put(`/api/trips/activities/${activityId}`, data);
    return response.data;
  },

  deleteActivity: async (activityId) => {
    const response = await api.delete(`/api/trips/activities/${activityId}`);
    return response.data;
  },
};
