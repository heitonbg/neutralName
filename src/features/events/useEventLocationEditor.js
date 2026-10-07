import { useEffect, useState } from "react";
import { findNearestCity } from "../../utils/citySearch";

export function useEventLocationEditor({
  store,
  city,
  formData,
  setFormData,
  setErrors,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [draftPoint, setDraftPoint] = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);

  useEffect(() => {
    const query = formData.address.trim();
    if (!showSuggestions || query.length < 3 || formData.format === "Онлайн") {
      setAddressSuggestions([]);
      setAddressSearchLoading(false);
      setAddressSearchError("");
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setAddressSearchLoading(true);
      setAddressSearchError("");
      try {
        const selectedCity = String(formData.city || city || "").trim();
        const queryIncludesCity =
          selectedCity &&
          query.toLocaleLowerCase().includes(selectedCity.toLocaleLowerCase());
        const result = await store.events.geocodeAddress(
          queryIncludesCity || !selectedCity
            ? query
            : `${query}, ${selectedCity}`,
        );
        if (active) {
          setAddressSuggestions(
            Array.isArray(result.addresses) ? result.addresses : [],
          );
        }
      } catch (error) {
        if (active) {
          setAddressSuggestions([]);
          setAddressSearchError(error.message || "Не удалось найти адрес");
        }
      } finally {
        if (active) setAddressSearchLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    city,
    formData.address,
    formData.city,
    formData.format,
    showSuggestions,
    store.events,
  ]);

  const chooseSuggestion = (suggestion) => {
    const nearest = findNearestCity(suggestion.lat, suggestion.lng, 100);
    setFormData((previous) => ({
      ...previous,
      address: suggestion.label,
      district:
        nearest?.city.regionName || nearest?.city.name || previous.district,
      city: nearest?.city.name || previous.city,
      lat: suggestion.lat,
      lng: suggestion.lng,
    }));
    setDraftPoint({ lat: suggestion.lat, lng: suggestion.lng });
    setShowMapPicker(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setAddressSearchError("");
  };

  const handleAddressChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      address: value,
      lat: null,
      lng: null,
    }));
    setErrors((previous) =>
      previous.address ? { ...previous, address: null } : previous,
    );
    setDraftPoint(null);
    setDetectedCity(null);
    setShowSuggestions(true);
  };

  const handleMapPointSelect = (latlng) => {
    setDraftPoint(latlng);

    const nearest = findNearestCity(latlng.lat, latlng.lng, 100);
    setDetectedCity(nearest?.city || null);

    setFormData((previous) => ({
      ...previous,
      lat: latlng.lat,
      lng: latlng.lng,
      city: nearest?.city.name || previous.city,
      address: nearest
        ? `${nearest.city.name}, место на карте`
        : previous.address,
      district: nearest?.city.name
        ? `${nearest.city.name}${nearest.city.regionName ? `, ${nearest.city.regionName}` : ""}`
        : previous.district,
    }));

    store.events
      .reverseGeocode(latlng.lat, latlng.lng)
      .then((resolved) => {
        if (!resolved) return;
        const address = resolved.street
          ? [resolved.street, resolved.district, resolved.city]
              .filter(Boolean)
              .join(", ")
          : resolved.displayName ||
            [resolved.district, resolved.city].filter(Boolean).join(", ");
        if (!address) return;
        setFormData((previous) =>
          previous.lat === latlng.lat && previous.lng === latlng.lng
            ? {
                ...previous,
                address,
                district: resolved.district || previous.district,
                city: resolved.city || previous.city,
              }
            : previous,
        );
      })
      .catch(() => {});
  };

  const confirmPoint = async () => {
    if (!draftPoint) return;

    const nearest = findNearestCity(draftPoint.lat, draftPoint.lng, 100);
    let resolved = null;
    try {
      resolved = await store.events.reverseGeocode(
        draftPoint.lat,
        draftPoint.lng,
      );
    } catch {}

    setFormData((previous) => ({
      ...previous,
      lat: draftPoint.lat,
      lng: draftPoint.lng,
      address: resolved?.street
        ? [resolved.street, resolved.district, resolved.city]
            .filter(Boolean)
            .join(", ")
        : resolved?.displayName ||
          [resolved?.district, resolved?.city].filter(Boolean).join(", ") ||
          `${nearest?.city.name || previous.city}, место на карте`,
      district:
        resolved?.district ||
        (nearest?.city.name
          ? `${nearest.city.name}${nearest.city.regionName ? `, ${nearest.city.regionName}` : ""}`
          : previous.district || previous.city),
      city: resolved?.city || nearest?.city.name || previous.city,
    }));

    setShowMapPicker(false);
  };

  return {
    showSuggestions,
    setShowSuggestions,
    addressSuggestions,
    addressSearchLoading,
    addressSearchError,
    showMapPicker,
    setShowMapPicker,
    draftPoint,
    setDraftPoint,
    detectedCity,
    setDetectedCity,
    chooseSuggestion,
    handleAddressChange,
    handleMapPointSelect,
    confirmPoint,
  };
}
