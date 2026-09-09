import api from './axiosConfig';

export const memberApi = {
  getMembers: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/members`);
    return response.data;
  },

  addMember: async (tripId, memberData) => {
    const response = await api.post(`/api/trips/${tripId}/members`, memberData);
    return response.data;
  },

  removeMember: async (tripId, userId) => {
    const response = await api.delete(`/api/trips/${tripId}/members/${userId}`);
    return response.data;
  },

  updateMemberRole: async (tripId, userId, roleData) => {
    const response = await api.put(`/api/trips/${tripId}/members/${userId}/role`, roleData);
    return response.data;
  },

  getJoinRequests: async (tripId) => {
    const response = await api.get(`/api/trips/${tripId}/join-requests`);
    return response.data;
  },

  approveJoinRequest: async (tripId, requestId) => {
    const response = await api.post(`/api/trips/${tripId}/join-requests/${requestId}/approve`);
    return response.data;
  },

  rejectJoinRequest: async (tripId, requestId) => {
    const response = await api.post(`/api/trips/${tripId}/join-requests/${requestId}/reject`);
    return response.data;
  },

  acceptInvitation: async (tripId) => {
    const response = await api.post(`/api/trips/${tripId}/members/accept`);
    return response.data;
  },

  rejectInvitation: async (tripId) => {
    const response = await api.post(`/api/trips/${tripId}/members/reject`);
    return response.data;
  },
};
