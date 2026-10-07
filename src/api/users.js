import { ApiError, apiRequest } from './client.js';

export const fetchBootstrap = () => apiRequest('/api/bootstrap');

export async function fetchUser(userId) {
  try {
    return await apiRequest(`/api/users/${encodeURIComponent(userId)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const updateUser = (patch) =>
  apiRequest('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
