import { cityStorage } from '../utils/cityStorage.js';
import { storage } from '../utils/storage.js';
import { isGuestModeEnabled } from '../app/guestMode.js';
import { maxBridge } from '../utils/maxBridge.js';
import { EventsStore } from './EventsStore.js';
import { FiltersStore } from './FiltersStore.js';
import { FriendsStore } from './FriendsStore.js';
import { SessionStore } from './SessionStore.js';
import { TouristStore } from './TouristStore.js';
import { UiStore } from './UiStore.js';

const DEFAULT_CITY = {
  name: 'Казань',
  lat: 55.789,
  lng: 49.122,
  population: 1243500,
  type: 'город',
  region: '73',
  regionName: 'Татарстан',
  geonameid: 551487,
};

function getSavedCity() {
  const city = cityStorage.get();
  return city?.name &&
    Number.isFinite(Number(city.lat)) &&
    Number.isFinite(Number(city.lng))
    ? city
    : DEFAULT_CITY;
}

export class RootStore {
  ui;
  session;
  filters;
  events;
  friends;
  tourist;

  constructor() {
    storage.cleanupLegacy();
    const savedCity = cityStorage.get();
    this.ui = new UiStore(this, {
      theme: storage.getTheme(),
      isGuestMode: isGuestModeEnabled({
        isDevelopment: import.meta.env.DEV,
        search: window.location.search,
        sessionStorage: window.sessionStorage,
        hasMaxSession: Boolean(maxBridge.getInitData()),
      }),
      sessionStorage: window.sessionStorage,
    });
    this.session = new SessionStore(this, {
      profile: storage.getProfile('anon'),
      selectedCity: getSavedCity(),
      notificationsOn: storage.getNotifications(),
      hasSavedCity: Boolean(savedCity?.name),
    });
    this.filters = new FiltersStore(this, {
      sortBy: storage.getSort(),
      likedIds: storage.getLiked(),
    });
    this.events = new EventsStore(this);
    this.friends = new FriendsStore(this);
    this.tourist = new TouristStore(this);
  }
}
