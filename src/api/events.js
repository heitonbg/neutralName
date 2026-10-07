import { apiRequest } from './client.js';

export const fetchEvents = async (filters = {}) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(
      ([, value]) => value != null && value !== ''
    )
  ).toString();
  return apiRequest(params ? `/api/events?${params}` : '/api/events');
};

export const fetchEvent = (eventId) => apiRequest(`/api/events/${eventId}`);

export const fetchJoinedIds = async () => {
  const data = await apiRequest('/api/events/joined');
  return data.eventIds || [];
};

export const fetchParticipatedIds = async () => {
  const data = await apiRequest('/api/events/participated');
  return data.eventIds || [];
};

export const fetchParticipants = async (eventId) => {
  const data = await apiRequest(`/api/events/${eventId}/participants`);
  return data.participants || [];
};

export const createEvent = (eventData) =>
  apiRequest('/api/events', { method: 'POST', body: JSON.stringify(eventData) });

export const updateEvent = (eventId, eventData) =>
  apiRequest(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });

export const joinEvent = (eventId, userProfile) =>
  apiRequest(`/api/events/${eventId}/join`, {
    method: 'POST',
    body: JSON.stringify({ userProfile }),
  });

export const leaveEvent = (eventId) =>
  apiRequest(`/api/events/${eventId}/leave`, { method: 'POST' });

export const deleteEvent = (eventId) =>
  apiRequest(`/api/events/${eventId}`, { method: 'DELETE' });

export const fetchReviews = (eventId) =>
  apiRequest(`/api/events/${eventId}/reviews`);

export const addReview = (review) =>
  apiRequest(`/api/events/${review.eventId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
