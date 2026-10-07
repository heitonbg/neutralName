import { useCallback, useMemo } from "react";
import {
  eventBelongsToCity,
  formatDistance,
  haversineDistance,
} from "../utils/distance.js";
import { getReferenceCoords } from "../utils/geoCoords.js";
import {
  getEventStatus,
  isOnlineEvent,
  matchesConfiguredFilters,
  matchesDateRange,
  matchesTimeFilter,
} from "../utils/eventFilters.js";

const BASE_QUICK_FILTERS = [
  "Сегодня",
  "Бесплатно",
  "Онлайн",
  "Пушкинская карта",
  "Волонтёрство",
  "Спорт",
  "Свободен сейчас",
];

export function useFilteredEvents({
  events,
  userCoords,
  selectedCity,
  searchQuery,
  quickFilter,
  filters,
  sortBy,
  mapTimeFilter,
  activeTab,
}) {
  const referenceCoords = useMemo(
    () => getReferenceCoords(userCoords, selectedCity),
    [userCoords, selectedCity],
  );

  const quickFilters = useMemo(() => {
    const categories = [
      ...new Set(events.map((event) => event.category).filter(Boolean)),
    ];
    return [...new Set([...BASE_QUICK_FILTERS, ...categories])];
  }, [events]);

  const visibleQuickFilters =
    activeTab === "map"
      ? quickFilters.filter(
          (filter) => !["Сегодня", "Свободен сейчас"].includes(filter),
        )
      : quickFilters;

  const activeFiltersCount = useMemo(() => {
    if (!filters) return 0;
    let count = 0;
    if (filters.category?.length) count += filters.category.length;
    if (filters.price) count += 1;
    if (filters.format) count += 1;
    if (filters.time) count += 1;
    if (filters.distance) count += 1;
    if (filters.pushkinCard) count += 1;
    return count;
  }, [filters]);

  const applyCommonFilters = useCallback(
    (list, { skipCity = false, skipTime = false } = {}) => {
      let result = [...list];

      if (!skipCity && selectedCity) {
        result = result.filter((event) => {
          if (
            event.city &&
            selectedCity.name &&
            event.city === selectedCity.name
          ) {
            return true;
          }
          return eventBelongsToCity(event, selectedCity, 40);
        });
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter((event) =>
          [
            event.title,
            event.description,
            event.category,
            event.address,
            event.district,
            event.organizer?.name,
          ]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(query)),
        );
      }

      if (quickFilter === "Сегодня" && !skipTime) {
        result = result.filter((event) => matchesTimeFilter(event, "Сегодня"));
      } else if (quickFilter === "Бесплатно") {
        result = result.filter((event) => event.price === "Бесплатно");
      } else if (quickFilter === "Онлайн") {
        result = result.filter(isOnlineEvent);
      } else if (quickFilter === "Пушкинская карта") {
        result = result.filter((event) => event.price === "Пушкинская карта");
      } else if (quickFilter === "Волонтёрство") {
        result = result.filter((event) =>
          /волонт/i.test(
            `${event.category || ""} ${event.title || ""} ${event.description || ""}`,
          ),
        );
      } else if (quickFilter === "Спорт") {
        result = result.filter((event) => /спорт/i.test(event.category || ""));
      } else if (quickFilter === "Свободен сейчас" && !skipTime) {
        result = result.filter((event) => matchesTimeFilter(event, "Сейчас"));
      } else if (
        quickFilter &&
        !(skipTime && ["Сегодня", "Свободен сейчас"].includes(quickFilter))
      ) {
        result = result.filter((event) => event.category === quickFilter);
      }

      if (filters) {
        const configuredFilters = skipTime
          ? { ...filters, time: null }
          : filters;
        result = result.filter((event) =>
          matchesConfiguredFilters(event, configuredFilters, referenceCoords),
        );
      }

      const showPast = !skipTime && filters?.time === "Сейчас";
      if (!showPast) {
        result = result.filter((event) => getEventStatus(event) !== "past");
      }

      if (referenceCoords) {
        result = result.map((event) => {
          if (event.lat != null && event.lng != null) {
            const distance = haversineDistance(
              referenceCoords.lat,
              referenceCoords.lng,
              Number(event.lat),
              Number(event.lng),
            );
            return {
              ...event,
              distance: formatDistance(distance),
              _distanceValue: distance,
              _distanceSource: referenceCoords.source,
            };
          }
          return {
            ...event,
            _distanceValue: 999,
            _distanceSource: referenceCoords.source,
          };
        });
      } else {
        result = result.map((event) => ({
          ...event,
          _distanceValue: 999,
          _distanceSource: null,
        }));
      }

      return result;
    },
    [filters, quickFilter, referenceCoords, searchQuery, selectedCity],
  );

  const sortEvents = useCallback(
    (list) => {
      const sorted = [...list];
      switch (sortBy) {
        case "popular":
          sorted.sort((a, b) => (b.participants || 0) - (a.participants || 0));
          break;
        case "new":
          sorted.sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
          );
          break;
        case "distance":
        default:
          sorted.sort((a, b) => a._distanceValue - b._distanceValue);
      }
      return sorted;
    },
    [sortBy],
  );

  const filteredEvents = useMemo(
    () => sortEvents(applyCommonFilters(events)),
    [applyCommonFilters, events, sortEvents],
  );

  const mapEvents = useMemo(
    () =>
      sortEvents(
        applyCommonFilters(events, { skipCity: true, skipTime: true }).filter(
          (event) => matchesDateRange(event, mapTimeFilter),
        ),
      ),
    [applyCommonFilters, events, mapTimeFilter, sortEvents],
  );

  return {
    referenceCoords,
    visibleQuickFilters,
    activeFiltersCount,
    filteredEvents,
    mapEvents,
  };
}
