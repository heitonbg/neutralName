import { apiRequest } from './client.js';

export const checkHealth = () => apiRequest('/health');
