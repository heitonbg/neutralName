import { describe, expect, it } from "vitest";
import {
  GUEST_MODE_STORAGE_KEY,
  isGuestModeEnabled,
  persistGuestMode,
} from "./guestMode.js";

function createSessionStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("guest test mode", () => {
  it("is disabled outside development, even if explicitly requested", () => {
    expect(
      isGuestModeEnabled({
        isDevelopment: false,
        search: "?guest=1",
        sessionStorage: createSessionStorage({
          [GUEST_MODE_STORAGE_KEY]: "1",
        }),
      }),
    ).toBe(false);
  });

  it("can be started using the guest query parameter", () => {
    expect(
      isGuestModeEnabled({ isDevelopment: true, search: "?guest=1" }),
    ).toBe(true);
  });

  it("defaults to read-only guest mode in development without a MAX session", () => {
    expect(
      isGuestModeEnabled({
        isDevelopment: true,
        hasMaxSession: false,
      }),
    ).toBe(true);
  });

  it("does not override an available MAX session", () => {
    expect(
      isGuestModeEnabled({
        isDevelopment: true,
        hasMaxSession: true,
      }),
    ).toBe(false);
  });

  it("restores the choice from session storage", () => {
    expect(
      isGuestModeEnabled({
        isDevelopment: true,
        sessionStorage: createSessionStorage({
          [GUEST_MODE_STORAGE_KEY]: "1",
        }),
      }),
    ).toBe(true);
  });

  it("persists and clears the guest choice", () => {
    const sessionStorage = createSessionStorage();

    expect(persistGuestMode(sessionStorage, true)).toBe(true);
    expect(sessionStorage.getItem(GUEST_MODE_STORAGE_KEY)).toBe("1");
    expect(persistGuestMode(sessionStorage, false)).toBe(true);
    expect(sessionStorage.getItem(GUEST_MODE_STORAGE_KEY)).toBe(null);
  });
});
