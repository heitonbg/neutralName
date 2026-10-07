import { makeAutoObservable, runInAction } from 'mobx';
import {
  fetchTouristPlans,
  generateTouristPlan,
  geocodeTouristAddress,
  recommendTouristPlaces,
  saveTouristPlan,
  searchTouristPlacesByText,
} from '../api/tourist.js';
import { reverseGeocode } from '../api/geo.js';
import { touristPlanStorage } from '../utils/touristPlanStorage.js';

export class TouristStore {
  touristMapRoute = null;
  savedPlanVersion = 0;
  root;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  get savedPlan() {
    return {
      version: this.savedPlanVersion,
      plan: touristPlanStorage.getLatest(this.root.session.userId),
    };
  }

  setValue(key, value) {
    if (!(key in this)) throw new Error(`Unknown TouristStore field: ${key}`);
    this[key] = typeof value === 'function' ? value(this[key]) : value;
  }

  generatePlan(options) {
    return generateTouristPlan(options);
  }

  recommendPlaces(options) {
    return recommendTouristPlaces(options);
  }

  searchPlaces(options) {
    return searchTouristPlacesByText(options);
  }

  geocodeAddress(address) {
    return geocodeTouristAddress(address);
  }

  reverseGeocode(latitude, longitude) {
    return reverseGeocode(latitude, longitude);
  }

  savePlan(plan) {
    return saveTouristPlan(plan);
  }

  saveLocalPlan(plan) {
    const userId = this.root.session.userId;
    if (!userId) return null;
    const saved = touristPlanStorage.save(userId, plan);
    if (saved) this.savedPlanVersion += 1;
    return saved;
  }

  pinOffline(plan) {
    const userId = this.root.session.userId;
    if (!userId) return null;
    const saved = touristPlanStorage.pinOffline(userId, plan);
    if (saved) this.savedPlanVersion += 1;
    return saved;
  }

  async sync() {
    const userId = this.root.session.userId;
    if (!userId) return;

    const migratedPlans = touristPlanStorage.migrateAnonymous(userId);
    if (migratedPlans.length) this.savedPlanVersion += 1;

    const response = await fetchTouristPlans();
    if (this.root.session.userId !== userId) return;
    if (!Array.isArray(response.plans)) {
      throw new TypeError('API returned an invalid tourist plans list');
    }

    const remoteByKey = new Map(
      response.plans.map((plan) => [`${plan.city}:${plan.date}`, plan]),
    );
    for (const localPlan of touristPlanStorage.getAll(userId)) {
      const planKey = `${localPlan.city}:${localPlan.date}`;
      const remotePlan = remoteByKey.get(planKey);
      if (
        remotePlan &&
        Date.parse(remotePlan.savedAt) >= Date.parse(localPlan.savedAt)
      ) {
        continue;
      }
      const saved = await this.savePlan(localPlan);
      if (saved.plan) remoteByKey.set(planKey, saved.plan);
      if (this.root.session.userId !== userId) return;
    }

    touristPlanStorage.mergeFromServer(userId, [...remoteByKey.values()]);
    runInAction(() => {
      this.savedPlanVersion += 1;
    });
  }
}
