import { makeAutoObservable, runInAction } from 'mobx';
import {
  acceptFriend,
  declineFriend,
  fetchFriendStatus,
  fetchFriends,
  removeFriend,
  requestFriend,
  searchFriends,
} from '../api/friends.js';

export class FriendsStore {
  friends = [];
  incoming = [];
  outgoing = [];
  friendsCount = 0;
  incomingFriendsCount = 0;
  root;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  setValue(key, value) {
    if (!(key in this)) throw new Error(`Unknown FriendsStore field: ${key}`);
    this[key] = typeof value === 'function' ? value(this[key]) : value;
  }

  async refreshCounts() {
    return this.load();
  }

  async load() {
    const userId = this.root.session.userId;
    if (!userId) return null;
    const friendsData = await fetchFriends();
    if (this.root.session.userId !== userId) return null;
    const data = {
      friends: friendsData?.friends,
      incoming: friendsData?.incoming,
      outgoing: friendsData?.outgoing,
    };
    runInAction(() => {
      this.friends = Array.isArray(data?.friends) ? data.friends : [];
      this.incoming = Array.isArray(data?.incoming) ? data.incoming : [];
      this.outgoing = Array.isArray(data?.outgoing) ? data.outgoing : [];
      this.friendsCount = this.friends.length;
      this.incomingFriendsCount = this.incoming.length;
    });
    return data;
  }

  search(query, options) {
    return searchFriends(query, options);
  }

  getStatus(otherId) {
    return fetchFriendStatus(otherId);
  }

  request(otherId) {
    return requestFriend(otherId);
  }

  accept(otherId) {
    return acceptFriend(otherId);
  }

  decline(otherId) {
    return declineFriend(otherId);
  }

  remove(otherId) {
    return removeFriend(otherId);
  }
}
