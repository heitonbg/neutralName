import { apiRequest } from './client.js';
import { openMaxChat } from '../utils/maxBridge.js';

export const fetchFriends = () => apiRequest('/api/friends');

export async function fetchFriendRequests() {
  const data = await fetchFriends();
  return {
    incoming: data.incoming || [],
    outgoing: data.outgoing || [],
  };
}

export const fetchFriendStatus = (otherId) =>
  apiRequest(`/api/friends/status?otherId=${encodeURIComponent(otherId)}`);

export async function searchFriends(query, { signal } = {}) {
  const q = String(query || '').trim();
  if (q.length < 2) return { results: [] };
  const data = await apiRequest(`/api/users/search?q=${encodeURIComponent(q)}`, {
    signal,
  });
  const users = Array.isArray(data.users)
    ? data.users
    : Array.isArray(data.results)
      ? data.results
      : [];
  return { results: users };
}

export const requestFriend = (toId) =>
  apiRequest('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ toId }),
  });

export const sendFriendRequest = requestFriend;

export const acceptFriend = (fromId) =>
  apiRequest('/api/friends/accept', {
    method: 'POST',
    body: JSON.stringify({ fromId }),
  });

export const acceptFriendRequest = acceptFriend;

export const declineFriend = (fromId) =>
  apiRequest('/api/friends/decline', {
    method: 'POST',
    body: JSON.stringify({ fromId }),
  });

export const declineFriendRequest = declineFriend;

export const removeFriend = (friendId) =>
  apiRequest(`/api/friends/${encodeURIComponent(friendId)}`, {
    method: 'DELETE',
  });

export { openMaxChat };
