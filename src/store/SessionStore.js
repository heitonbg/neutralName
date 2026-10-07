import { makeAutoObservable, runInAction } from 'mobx';
import { fetchBootstrap, fetchUser, updateUser } from '../api/users.js';
import { storage } from '../utils/storage.js';

export class SessionStore {
  user = null;
  profile;
  selectedCity;
  userCoords = null;
  notificationsOn;
  hasSavedCity;
  root;

  constructor(root, { profile, selectedCity, notificationsOn, hasSavedCity }) {
    this.root = root;
    this.profile = profile;
    this.selectedCity = selectedCity;
    this.notificationsOn = notificationsOn;
    this.hasSavedCity = hasSavedCity;
    makeAutoObservable(this, { root: false });
  }

  get userId() {
    return this.root.ui.isGuestMode || !this.user?.id
      ? null
      : String(this.user.id);
  }

  setValue(key, value) {
    if (!(key in this)) throw new Error(`Unknown SessionStore field: ${key}`);
    this[key] = typeof value === 'function' ? value(this[key]) : value;
  }

  async loadBootstrap() {
    const userId = this.userId;
    if (!userId) return null;

    const data = await fetchBootstrap();
    if (this.userId !== userId || !data) return null;

    if (Array.isArray(data.joinedIds)) {
      this.root.events.setValue(
        'joinedIds',
        data.joinedIds.map(Number).filter(Number.isFinite),
      );
    }
    if (Array.isArray(data.participatedIds)) {
      this.root.events.setValue(
        'participatedIds',
        data.participatedIds.map(Number).filter(Number.isFinite),
      );
    }
    if (Array.isArray(data.createdIds)) {
      this.root.events.setValue(
        'createdIds',
        data.createdIds.map(Number).filter(Number.isFinite),
      );
    }

    if (data.user && typeof data.user === 'object') {
      runInAction(() => {
        this.profile = { ...this.profile, ...data.user };
      });
      storage.setProfile(userId, {
        ...(storage.getProfile(userId) || {}),
        ...data.user,
      });

      if (data.user.city) {
        const { findCityByName } = await import('../utils/citySearch.js');
        const city = findCityByName(data.user.city);
        if (city && this.userId === userId) {
          runInAction(() => {
            this.selectedCity = city;
          });
        }
      }
      runInAction(() => {
        if (typeof data.user.notificationsEnabled === 'boolean') {
          this.notificationsOn = data.user.notificationsEnabled;
        }
        if (data.user.theme === 'light' || data.user.theme === 'dark') {
          this.root.ui.setValue('theme', data.user.theme);
        }
      });
    }
    return data;
  }

  async updateProfile(patch) {
    return updateUser(patch);
  }

  async loadUserProfile(profileId) {
    return fetchUser(profileId);
  }

  loadCachedProfile() {
    const profile = storage.getProfile(this.userId || 'anon');
    if (profile && Object.keys(profile).length) this.profile = profile;
  }

  saveProfileLocally(profile) {
    storage.setProfile(this.userId || 'anon', profile);
  }
}
