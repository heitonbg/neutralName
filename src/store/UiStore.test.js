import { describe, expect, it } from "vitest";
import { GUEST_MODE_STORAGE_KEY } from "../app/guestMode.js";
import { UiStore } from "./UiStore.js";

describe("UiStore guest mode", () => {
  it("updates the mode and persists it", () => {
    const values = new Map();
    const sessionStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    };
    const store = new UiStore(
      {},
      {
        theme: "light",
        isGuestMode: false,
        sessionStorage,
      },
    );

    expect(store.setGuestMode(true)).toBe(true);
    expect(store.isGuestMode).toBe(true);
    expect(values.get(GUEST_MODE_STORAGE_KEY)).toBe("1");

    expect(store.setGuestMode(false)).toBe(true);
    expect(store.isGuestMode).toBe(false);
    expect(values.has(GUEST_MODE_STORAGE_KEY)).toBe(false);
  });

  it("reports storage failures while keeping the in-memory mode usable", () => {
    const sessionStorage = {
      setItem() {
        throw new Error("storage unavailable");
      },
      removeItem() {
        throw new Error("storage unavailable");
      },
    };
    const store = new UiStore(
      {},
      {
        theme: "light",
        isGuestMode: false,
        sessionStorage,
      },
    );

    expect(store.setGuestMode(true)).toBe(false);
    expect(store.isGuestMode).toBe(true);
  });
});
