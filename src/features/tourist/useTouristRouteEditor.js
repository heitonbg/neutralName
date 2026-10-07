import {
  getTouristRouteStops,
  getTouristStopKey,
  isTouristPlace,
} from "../../utils/touristMapLinks.js";

export function useTouristRouteEditor({
  selectedOption,
  setPlan,
  setInterests,
  markPlanDirty,
}) {
  const routeStops = selectedOption ? getTouristRouteStops(selectedOption) : [];

  const handleRemoveEvent = (eventId) => {
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === current.selectedOptionId
          ? (() => {
              const nextOption = {
                ...option,
                events: option.events.filter((event) => event.id !== eventId),
                places: (option.places || []).filter(
                  (place) => String(place.eventId) !== String(eventId),
                ),
              };
              return {
                ...nextOption,
                stopOrder:
                  getTouristRouteStops(nextOption).map(getTouristStopKey),
              };
            })()
          : option,
      ),
      savedAt: null,
    }));
    markPlanDirty();
  };

  const handleRemoveCustomStop = (stopId) => {
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) => {
        if (option.id !== current.selectedOptionId) return option;
        const nextOption = {
          ...option,
          customStops: (option.customStops || []).filter(
            (stop) => stop.id !== stopId,
          ),
        };
        return {
          ...nextOption,
          stopOrder: getTouristRouteStops(nextOption).map(getTouristStopKey),
        };
      }),
      savedAt: null,
    }));
    markPlanDirty();
  };

  const toggleInterest = (interest) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const selectOption = (optionId) => {
    setPlan((current) => ({
      ...current,
      selectedOptionId: optionId,
      savedAt: null,
    }));
    markPlanDirty();
  };

  const togglePlace = (place) => {
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) => {
        if (option.id !== current.selectedOptionId) return option;
        const selected = option.places || [];
        const exists = selected.some((item) => item.id === place.id);
        const nextPlaces = exists
          ? selected.filter((item) => item.id !== place.id)
          : [
              ...selected,
              {
                ...place,
                durationMinutes:
                  place.durationMinutes ||
                  (["restaurant", "hotel", "shop"].includes(place.kind)
                    ? 45
                    : 60),
              },
            ];
        const nextOption = { ...option, places: nextPlaces };
        const nextStops = getTouristRouteStops(nextOption);
        if (!exists) {
          const placeIndex = nextStops.findIndex(
            (stop) => getTouristStopKey(stop) === getTouristStopKey(place),
          );
          const reorderedStops = [...nextStops];
          const [addedStop] = reorderedStops.splice(placeIndex, 1);
          const eventIndex = reorderedStops.findIndex(
            (stop) =>
              !isTouristPlace(stop) &&
              String(stop.id) === String(place.eventId),
          );
          let insertionIndex =
            eventIndex < 0 ? reorderedStops.length : eventIndex + 1;
          while (
            insertionIndex < reorderedStops.length &&
            isTouristPlace(reorderedStops[insertionIndex]) &&
            String(reorderedStops[insertionIndex].eventId) ===
              String(place.eventId)
          ) {
            insertionIndex += 1;
          }
          reorderedStops.splice(insertionIndex, 0, addedStop);
          nextOption.stopOrder = reorderedStops.map(getTouristStopKey);
        } else {
          nextOption.stopOrder = nextStops.map(getTouristStopKey);
        }
        return nextOption;
      }),
      savedAt: null,
    }));
    markPlanDirty();
  };

  const reorderStop = (fromKey, toKey) => {
    if (
      !(fromKey?.startsWith("place:") || fromKey?.startsWith("custom:")) ||
      !toKey ||
      fromKey === toKey
    ) {
      return;
    }
    const nextStops = [...routeStops];
    const fromIndex = nextStops.findIndex(
      (stop) => getTouristStopKey(stop) === fromKey,
    );
    const toIndex = nextStops.findIndex(
      (stop) => getTouristStopKey(stop) === toKey,
    );
    if (fromIndex < 0 || toIndex < 0) return;
    const [movedStop] = nextStops.splice(fromIndex, 1);
    nextStops.splice(toIndex, 0, movedStop);
    const stopOrder = nextStops.map(getTouristStopKey);
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === current.selectedOptionId
          ? { ...option, stopOrder, savedAt: null }
          : option,
      ),
    }));
    markPlanDirty();
  };

  const moveStop = (index, direction) => {
    const target = Math.max(
      0,
      Math.min(routeStops.length - 1, index + direction),
    );
    if (target !== index) {
      reorderStop(
        getTouristStopKey(routeStops[index]),
        getTouristStopKey(routeStops[target]),
      );
    }
  };

  const addCustomStop = (stop) => {
    const customStop = {
      ...stop,
      id:
        stop.id ||
        `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "custom",
      kindLabel: stop.kindLabel || "Моя остановка",
      durationMinutes: Number(stop.durationMinutes) || 45,
      source: stop.source || "manual",
    };
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) => {
        if (option.id !== current.selectedOptionId) return option;
        const nextOption = {
          ...option,
          customStops: [...(option.customStops || []), customStop],
        };
        return {
          ...nextOption,
          stopOrder: getTouristRouteStops(nextOption).map(getTouristStopKey),
        };
      }),
      savedAt: null,
    }));
    markPlanDirty();
  };

  const updatePlaceDuration = (placeId, durationMinutes) => {
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === current.selectedOptionId
          ? {
              ...option,
              places: (option.places || []).map((place) =>
                place.id === placeId
                  ? { ...place, durationMinutes: Number(durationMinutes) }
                  : place,
              ),
              customStops: (option.customStops || []).map((stop) =>
                stop.id === placeId
                  ? { ...stop, durationMinutes: Number(durationMinutes) }
                  : stop,
              ),
              savedAt: null,
            }
          : option,
      ),
    }));
    markPlanDirty();
  };

  const updatePlaceStartTime = (placeId, startTime) => {
    setPlan((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === current.selectedOptionId
          ? {
              ...option,
              places: (option.places || []).map((place) =>
                place.id === placeId
                  ? { ...place, startTime: startTime || null }
                  : place,
              ),
              customStops: (option.customStops || []).map((stop) =>
                stop.id === placeId
                  ? { ...stop, startTime: startTime || null }
                  : stop,
              ),
              savedAt: null,
            }
          : option,
      ),
    }));
    markPlanDirty();
  };

  return {
    routeStops,
    handleRemoveEvent,
    handleRemoveCustomStop,
    toggleInterest,
    selectOption,
    togglePlace,
    reorderStop,
    moveStop,
    addCustomStop,
    updatePlaceDuration,
    updatePlaceStartTime,
  };
}
