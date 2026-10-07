import { apiRequest } from './client.js';

export const geocodeAddress = (query) =>
  apiRequest(`/api/cities/address?q=${encodeURIComponent(query)}`, {
    timeoutMs: 10000,
  });

export const reverseGeocode = (lat, lng) =>
  apiRequest(
    `/api/cities/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
  );
