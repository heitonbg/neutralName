import { makeAutoObservable, runInAction } from 'mobx';
import {
  addReview as addReviewRequest,
  createEvent as createEventRequest,
  deleteEvent as deleteEventRequest,
  fetchEvent,
  fetchEvents,
  fetchParticipants,
  fetchReviews,
  joinEvent as joinEventRequest,
  leaveEvent as leaveEventRequest,
  updateEvent as updateEventRequest,
} from '../api/events.js';
import { geocodeAddress, reverseGeocode } from '../api/geo.js';
import { uploadImages } from '../api/upload.js';

export class EventsStore {
  eventsById = new Map();
  eventIds = [];
  loading = true;
  joinedIds = [];
  participatedIds = [];
  createdIds = [];
  pendingActions = {};
  reviewsByEvent = {};
  lastCreatedEventId = null;
  loadRequestId = 0;
  root;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false, loadRequestId: false });
  }

  get events() {
    return this.eventIds
      .map((id) => this.eventsById.get(id))
      .filter(Boolean);
  }

  set events(events) {
    this.eventIds = events.map((event) => event.id);
    this.eventsById = new Map(events.map((event) => [event.id, event]));
  }

  async loadParticipants(eventId) {
    return fetchParticipants(eventId);
  }

  geocodeAddress(address) {
    return geocodeAddress(address);
  }

  reverseGeocode(latitude, longitude) {
    return reverseGeocode(latitude, longitude);
  }

  uploadImages(files) {
    return uploadImages(files);
  }

  setValue(key, value) {
    if (!(key in this)) throw new Error(`Unknown EventsStore field: ${key}`);
    this[key] = typeof value === 'function' ? value(this[key]) : value;
  }

  async load(filters) {
    const requestId = ++this.loadRequestId;
    this.loading = true;
    try {
      const events = await fetchEvents(filters);
      if (!Array.isArray(events)) {
        throw new TypeError('API returned an invalid events list');
      }
      if (requestId !== this.loadRequestId) return this.events;
      runInAction(() => {
        this.events = events;
      });
      return events;
    } finally {
      if (requestId === this.loadRequestId) {
        runInAction(() => {
          this.loading = false;
        });
      }
    }
  }

  async ensure(eventId) {
    const cached = this.events.find((event) => Number(event.id) === Number(eventId));
    if (cached) return cached;
    const event = await fetchEvent(eventId);
    if (!event) return null;
    runInAction(() => {
      this.events = [
        event,
        ...this.events.filter((item) => item.id !== event.id),
      ];
    });
    return event;
  }

  async join(event, userProfile) {
    if (!event || this.pendingActions[event.id]) return null;
    this.setValue('pendingActions', (actions) => ({ ...actions, [event.id]: 'join' }));
    this.setValue('joinedIds', (ids) => ids.includes(event.id) ? ids : [...ids, event.id]);
    this.setValue('participatedIds', (ids) =>
      ids.includes(event.id) ? ids : [...ids, event.id],
    );
    this.adjustParticipants(event.id, 1);

    try {
      const result = await joinEventRequest(event.id, userProfile);
      if (typeof result.participants === 'number') {
        this.adjustParticipants(event.id, result.participants, true);
      }
      return result;
    } catch (error) {
      this.setValue('joinedIds', (ids) => ids.filter((id) => id !== event.id));
      this.setValue('participatedIds', (ids) => ids.filter((id) => id !== event.id));
      this.adjustParticipants(event.id, -1);
      throw error;
    } finally {
      this.clearPending(event.id);
    }
  }

  async leave(event) {
    if (!event || this.pendingActions[event.id]) return null;
    this.setValue('pendingActions', (actions) => ({ ...actions, [event.id]: 'leave' }));
    this.setValue('joinedIds', (ids) => ids.filter((id) => id !== event.id));
    this.adjustParticipants(event.id, -1);
    try {
      const result = await leaveEventRequest(event.id);
      if (typeof result.participants === 'number') {
        this.adjustParticipants(event.id, result.participants, true);
      }
      return result;
    } catch (error) {
      this.setValue('joinedIds', (ids) =>
        ids.includes(event.id) ? ids : [...ids, event.id],
      );
      this.adjustParticipants(event.id, 1);
      throw error;
    } finally {
      this.clearPending(event.id);
    }
  }

  async save(eventData, editingId = null) {
    const event = editingId
      ? await updateEventRequest(editingId, eventData)
      : await createEventRequest(eventData);
    this.setValue('events', (events) =>
      editingId
        ? events.map((item) => item.id === editingId ? event : item)
        : [event, ...events],
    );
    if (!editingId) {
      runInAction(() => {
        this.lastCreatedEventId = event.id;
      });
    }
    return event;
  }

  async remove(eventId) {
    if (this.pendingActions[eventId]) return;
    this.setValue('pendingActions', (actions) => ({ ...actions, [eventId]: 'delete' }));
    try {
      await deleteEventRequest(eventId);
      this.setValue('events', (events) => events.filter((event) => event.id !== eventId));
      this.setValue('joinedIds', (ids) => ids.filter((id) => id !== eventId));
      this.root.filters.setValue(
        'likedIds',
        (ids) => ids.filter((id) => id !== eventId),
      );
      if (this.lastCreatedEventId === eventId) this.lastCreatedEventId = null;
    } finally {
      this.clearPending(eventId);
    }
  }

  async loadReviews(eventId) {
    const reviews = await fetchReviews(eventId);
    this.setValue('reviewsByEvent', (current) => ({ ...current, [eventId]: reviews }));
    return reviews;
  }

  async addReview(review) {
    const created = await addReviewRequest(review);
    this.setValue('reviewsByEvent', (current) => ({
      ...current,
      [review.eventId]: [created, ...(current[review.eventId] || [])],
    }));
    return created;
  }

  setReviews(eventId, reviews) {
    this.setValue('reviewsByEvent', (current) => ({ ...current, [eventId]: reviews }));
  }

  replace(event) {
    this.setValue('events', (events) =>
      events.map((current) => current.id === event.id ? event : current),
    );
  }

  updateOrganizerProfile(userId, profile) {
    this.setValue('events', (events) =>
      events.map((event) => {
        const organizerId = event.organizerId ?? event.organizer?.id;
        return String(organizerId) === String(userId)
          ? { ...event, organizer: { ...event.organizer, ...profile } }
          : event;
      }),
    );
  }

  adjustParticipants(eventId, amount, absolute = false) {
    this.setValue('events', (events) =>
      events.map((event) => event.id === eventId
        ? {
            ...event,
            participants: absolute
              ? amount
              : Math.max(0, (Number(event.participants) || 0) + amount),
          }
        : event,
      ),
    );
  }

  clearPending(eventId) {
    this.setValue('pendingActions', (actions) => {
      const next = { ...actions };
      delete next[eventId];
      return next;
    });
  }
}
