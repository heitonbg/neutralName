import { makeAutoObservable } from 'mobx';
import { persistGuestMode } from '../app/guestMode.js';

export class UiStore {
  theme;
  toasts = [];
  isGuestMode;
  isFiltersOpen = false;
  isMenuOpen = false;
  selectedEvent = null;
  selectedOrganizer = null;
  participantsEvent = null;
  participantProfiles = [];
  loadingParticipants = false;
  selectedPerson = null;
  isCityOpen = false;
  isTouristPlanOpen = false;
  pendingDelete = null;
  deleting = false;
  deleteError = '';
  pendingLeave = null;
  editingEvent = null;
  root;
  sessionStorage;

  constructor(root, { theme, isGuestMode, sessionStorage }) {
    this.root = root;
    this.theme = theme;
    this.isGuestMode = isGuestMode;
    this.sessionStorage = sessionStorage;
    makeAutoObservable(this, { root: false, sessionStorage: false });
  }

  setValue(key, value) {
    if (!(key in this)) throw new Error(`Unknown UiStore field: ${key}`);
    this[key] = typeof value === 'function' ? value(this[key]) : value;
  }

  pushToast(text, variant = 'success') {
    const id = Date.now() + Math.random();
    this.toasts = [...this.toasts, { id, text, variant }];
    window.setTimeout(() => {
      this.setValue('toasts', (toasts) => toasts.filter((toast) => toast.id !== id));
    }, 3200);
  }

  dismissToast(id) {
    this.setValue('toasts', (toasts) => toasts.filter((toast) => toast.id !== id));
  }

  setGuestMode(enabled) {
    const persisted = persistGuestMode(this.sessionStorage, enabled);
    this.isGuestMode = enabled;
    return persisted;
  }
}
