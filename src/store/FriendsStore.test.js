import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFriends } from "../api/friends.js";
import { FriendsStore } from "./FriendsStore.js";

vi.mock("../api/friends.js", () => ({
  acceptFriend: vi.fn(),
  declineFriend: vi.fn(),
  fetchFriendStatus: vi.fn(),
  fetchFriends: vi.fn(),
  fetchFriendRequests: vi.fn(),
  openMaxChat: vi.fn(),
  removeFriend: vi.fn(),
  requestFriend: vi.fn(),
  searchFriends: vi.fn(),
}));

describe("FriendsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads friends and request counts into observable state", async () => {
    const root = { session: { userId: "42" } };
    const store = new FriendsStore(root);
    fetchFriends.mockResolvedValue({
      friends: [{ id: "7" }],
      incoming: [{ id: "8" }],
      outgoing: [{ id: "9" }],
    });

    await store.refreshCounts();

    expect(store.friends).toEqual([{ id: "7" }]);
    expect(store.incoming).toEqual([{ id: "8" }]);
    expect(store.outgoing).toEqual([{ id: "9" }]);
    expect(store.friendsCount).toBe(1);
    expect(store.incomingFriendsCount).toBe(1);
  });

  it("does not apply a response after the active user changes", async () => {
    let resolveRequest;
    fetchFriends.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const root = { session: { userId: "42" } };
    const store = new FriendsStore(root);
    const loadPromise = store.load();
    root.session.userId = "84";
    resolveRequest({ friends: [{ id: "7" }] });

    await expect(loadPromise).resolves.toBeNull();
    expect(store.friends).toEqual([]);
  });
});
