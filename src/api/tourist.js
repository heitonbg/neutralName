import { apiRequest } from './client.js';
import { maxBridge } from '../utils/maxBridge.js';

export const generateTouristPlan = (request) =>
  apiRequest('/api/tourist/plan', {
    method: 'POST',
    body: JSON.stringify(request),
    timeoutMs: 30000,
  });

export const searchTouristPlaces = ({ eventIds, kind }) =>
  apiRequest('/api/tourist/places', {
    method: 'POST',
    body: JSON.stringify({ eventIds, kind }),
    timeoutMs: 20000,
  });

export const recommendTouristPlaces = ({ eventIds, kind }) =>
  apiRequest('/api/tourist/recommendations', {
    method: 'POST',
    body: JSON.stringify({ eventIds, kind }),
    timeoutMs: 30000,
  });

export const searchTouristPlacesByText = ({ eventIds, query }) =>
  apiRequest('/api/tourist/search-places', {
    method: 'POST',
    body: JSON.stringify({ eventIds, query }),
    timeoutMs: 15000,
  });

export const geocodeTouristAddress = (query) =>
  apiRequest(`/api/cities/address?q=${encodeURIComponent(query)}`, {
    timeoutMs: 10000,
  });

function touristPlanRequest(path, options) {
  if (!maxBridge.getInitData()) {
    throw new Error('Откройте мини-приложение в MAX, чтобы синхронизировать маршрут.');
  }
  return apiRequest(path, options);
}

export const fetchTouristPlans = () => touristPlanRequest('/api/tourist/plans');

export const saveTouristPlan = (plan) =>
  touristPlanRequest('/api/tourist/plans', {
    method: 'PUT',
    body: JSON.stringify({ plan }),
  });

export const deleteTouristPlan = ({ city, date }) =>
  touristPlanRequest('/api/tourist/plans', {
    method: 'DELETE',
    body: JSON.stringify({ city, date }),
  });
