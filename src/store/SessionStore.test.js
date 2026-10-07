import { describe, expect, it } from "vitest";
import { observable } from "mobx";
import { SessionStore } from "./SessionStore.js";

describe("SessionStore", () => {
  it("derives the authenticated user id and suppresses it in guest mode", () => {
    const root = { ui: observable({ isGuestMode: false }) };
    const store = new SessionStore(root, {
      profile: {},
      selectedCity: null,
      notificationsOn: true,
    });

    store.setValue("user", { id: 42 });
    expect(store.userId).toBe("42");

    root.ui.isGuestMode = true;
    expect(store.userId).toBeNull();
  });

  it("supports state updater functions without exposing mutable setters", () => {
    const store = new SessionStore(
      { ui: { isGuestMode: false } },
      {
        profile: { about: "hello" },
        selectedCity: null,
        notificationsOn: true,
      },
    );

    store.setValue("profile", (profile) => ({ ...profile, city: "Казань" }));
    expect(store.profile).toEqual({ about: "hello", city: "Казань" });
  });
});
