import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useFilteredEvents } from "./useFilteredEvents.js";

function renderFilteredEvents(options) {
  let result;

  function Probe() {
    result = useFilteredEvents(options);
    return null;
  }

  renderToStaticMarkup(React.createElement(Probe));
  return result;
}

describe("useFilteredEvents", () => {
  it("filters the feed by city while keeping the map cross-city", () => {
    const result = renderFilteredEvents({
      events: [
        {
          id: 1,
          city: "Казань",
          lat: 55.789,
          lng: 49.122,
          participants: 5,
          startAt: "2099-01-01T10:00:00.000Z",
        },
        {
          id: 2,
          city: "Москва",
          lat: 55.752,
          lng: 37.618,
          participants: 15,
          startAt: "2099-01-01T10:00:00.000Z",
        },
      ],
      userCoords: null,
      selectedCity: { name: "Казань", lat: 55.789, lng: 49.122 },
      searchQuery: "",
      quickFilter: null,
      filters: null,
      sortBy: "popular",
      mapTimeFilter: "all",
      activeTab: "feed",
    });

    expect(result.filteredEvents.map((event) => event.id)).toEqual([1]);
    expect(result.mapEvents.map((event) => event.id)).toEqual([2, 1]);
  });

  it("counts configured filters without changing the selected event list", () => {
    const result = renderFilteredEvents({
      events: [],
      userCoords: null,
      selectedCity: null,
      searchQuery: "",
      quickFilter: null,
      filters: {
        category: ["Спорт", "Музыка"],
        price: "Бесплатно",
        format: null,
        time: null,
        distance: 10,
        pushkinCard: true,
      },
      sortBy: "distance",
      mapTimeFilter: "all",
      activeTab: "feed",
    });

    expect(result.activeFiltersCount).toBe(5);
    expect(result.filteredEvents).toEqual([]);
  });
});
