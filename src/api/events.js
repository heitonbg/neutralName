import { MOCK_EVENTS } from '../data/mockEvents';

// Локальный сервер
const API = 'http://localhost:3001';
const USE_MOCK = false;

let localEvents = [...MOCK_EVENTS];

const apiFetch = async (path, options = {}) => {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let errorMessage = `Ошибка ${res.status}`;
    try {
      const err = await res.json();
      errorMessage = err.error || errorMessage;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  return res.json();
};

export const fetchEvents = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return localEvents;
  }
  const params = new URLSearchParams(filters).toString();
  const path = params ? `/api/events?${params}` : '/api/events';
  return apiFetch(path);
};

export const createEvent = async (eventData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const newEvent = {
      ...eventData,
      id: Date.now(),
      participants: 1,
      rating: 0,
      reviewsCount: 0,
      createdAt: new Date().toISOString()
    };
    localEvents = [newEvent, ...localEvents];
    return newEvent;
  }
  return apiFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

export const joinEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    localEvents = localEvents.map((e) =>
      e.id === eventId ? { ...e, participants: e.participants + 1 } : e
    );
    return { success: true };
  }
  return apiFetch(`/api/events/${eventId}/join`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const reportEvent = async (eventId, reason, reporterId) => {
  if (USE_MOCK) {
    console.log('[Report]', { eventId, reason, reporterId });
    return { success: true };
  }
  return apiFetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ eventId, reason, reporterId })
  });
};

export const checkHealth = async () => {
  try {
    return await apiFetch('/health');
  } catch (e) {
    console.warn('Health check failed:', e.message);
    return { status: 'error', message: e.message };
  }
};