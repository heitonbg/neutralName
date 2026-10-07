import { describe, expect, it } from "vitest";
import {
  getActiveTab,
  getEditEventIdFromPath,
  getEventIdFromPath,
  getMainPath,
  getOrganizerIdFromPath,
  getParticipantsEventIdFromPath,
  getUserIdFromPath,
  isKnownRoute,
  TAB_PATHS,
} from "./navigation.js";

describe("route helpers", () => {
  it("resolves every direct tab URL and recognizes it as a supported route", () => {
    for (const [tab, pathname] of Object.entries(TAB_PATHS)) {
      expect(getActiveTab({ pathname, state: null })).toBe(tab);
      expect(isKnownRoute(pathname)).toBe(true);
    }
  });

  it("keeps direct modal deep links on a valid fallback tab", () => {
    const modalPaths = [
      "/tourist",
      "/events/42",
      "/events/42/participants",
      "/organizers/demo-organizer",
      "/users/7",
    ];

    for (const pathname of modalPaths) {
      expect(isKnownRoute(pathname)).toBe(true);
      expect(getMainPath({ pathname, state: null })).toBe("/");
      expect(getActiveTab({ pathname, state: null })).toBe("feed");
    }
  });

  it("selects the background tab while an event detail is open", () => {
    expect(
      getActiveTab({
        pathname: "/events/42",
        state: { background: { pathname: "/map" } },
      }),
    ).toBe("map");
  });

  it("restores the deepest background route for nested modal history", () => {
    const location = {
      pathname: "/users/7",
      state: {
        background: {
          pathname: "/events/42/participants",
          state: {
            background: {
              pathname: "/events/42",
              state: { background: { pathname: "/map" } },
            },
          },
        },
      },
    };

    expect(getMainPath(location)).toBe("/map");
    expect(getActiveTab(location)).toBe("map");
  });

  it("maps a direct event link back to the feed tab", () => {
    expect(getActiveTab({ pathname: "/events/42", state: null })).toBe("feed");
    expect(getEventIdFromPath("/events/42")).toBe(42);
    expect(getEventIdFromPath("/events/not-a-number")).toBeNull();
  });

  it("recognizes supported routes and rejects unknown paths", () => {
    expect(isKnownRoute("/events/new")).toBe(true);
    expect(isKnownRoute("/events/42/edit")).toBe(true);
    expect(isKnownRoute("/unexpected")).toBe(false);
    expect(getEditEventIdFromPath("/events/42/edit")).toBe(42);
    expect(getEditEventIdFromPath("/events/42")).toBeNull();
  });

  it("keeps event edit links on the create screen over their background", () => {
    expect(
      getActiveTab({
        pathname: "/events/42/edit",
        state: { background: { pathname: "/my" } },
      }),
    ).toBe("create");
  });

  it("resolves profile and participant routes to their underlying tab", () => {
    expect(
      getActiveTab({
        pathname: "/events/42/participants",
        state: {
          background: {
            pathname: "/events/42",
            state: { background: { pathname: "/map" } },
          },
        },
      }),
    ).toBe("map");
    expect(getParticipantsEventIdFromPath("/events/42/participants")).toBe(42);
    expect(getOrganizerIdFromPath("/organizers/9")).toBe(9);
    expect(getOrganizerIdFromPath("/organizers/demo-organizer")).toBe(
      "demo-organizer",
    );
    expect(getOrganizerIdFromPath("/organizers/unsafe.id")).toBeNull();
    expect(getUserIdFromPath("/users/7")).toBe(7);
    expect(isKnownRoute("/events/42/participants")).toBe(true);
    expect(isKnownRoute("/organizers/9")).toBe(true);
    expect(isKnownRoute("/organizers/demo-organizer")).toBe(true);
    expect(isKnownRoute("/users/7")).toBe(true);
  });
});
