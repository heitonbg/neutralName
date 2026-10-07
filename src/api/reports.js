import { apiRequest } from './client.js';

export const reportEvent = (eventId, reason) =>
  apiRequest('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ eventId, reason }),
  });
