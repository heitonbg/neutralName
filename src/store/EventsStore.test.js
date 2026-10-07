import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchEvents } from "../api/events.js";
import { EventsStore } from "./EventsStore.js";

vi.mock("../api/events.js", () => ({
  addReview: vi.fn(),
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  fetchEvent: vi.fn(),
  fetchEvents: vi.fn(),
  fetchParticipants: vi.fn(),
  fetchReviews: vi.fn(),
  joinEvent: vi.fn(),
  leaveEvent: vi.fn(),
  updateEvent: vi.fn(),
}));
vi.mock("../api/geo.js", () => ({
  geocodeAddress: vi.fn(),
  reverseGeocode: vi.fn(),
}));
vi.mock("../api/upload.js", () => ({
  uploadImages: vi.fn(),
}));

describe("EventsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps normalized event entities and a stable display order", async () => {
    const store = new EventsStore({ filters: { setValue: vi.fn() } });
    const events = [
      { id: 11, title: "First event" },
      { id: 12, title: "Second event" },
    ];
    fetchEvents.mockResolvedValue(events);

    await store.load();

    expect(store.eventIds).toEqual([11, 12]);
    expect(store.eventsById.get(11)).toEqual(events[0]);
    expect(store.events).toEqual(events);

    store.replace({ ...events[0], title: "Updated event" });
    expect(store.eventsById.get(11).title).toBe("Updated event");
    expect(store.events[0].title).toBe("Updated event");
  });

  it("does not let an older events request overwrite the latest result", async () => {
    const store = new EventsStore({ filters: { setValue: vi.fn() } });
    const resolveFirst = vi.fn();
    const resolveSecond = vi.fn();
    fetchEvents
      .mockReturnValueOnce(
        new Promise((resolve) => resolveFirst.mockImplementation(resolve)),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => resolveSecond.mockImplementation(resolve)),
      );

    const firstLoad = store.load({ city: "Казань" });
    const secondLoad = store.load({ city: "Москва" });
    resolveSecond([{ id: 2, title: "Latest" }]);
    await secondLoad;
    resolveFirst([{ id: 1, title: "Stale" }]);
    await firstLoad;

    expect(store.events).toEqual([{ id: 2, title: "Latest" }]);
    expect(store.loading).toBe(false);
  });
});
