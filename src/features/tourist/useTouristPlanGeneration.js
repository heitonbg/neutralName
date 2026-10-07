import { useState } from "react";
import { findCityByName } from "../../utils/citySearch.js";

export function useTouristPlanGeneration({
  form,
  userCoords,
  isGuestMode,
  offlinePinned,
  store,
  setPlan,
  setIsReplanning,
  markPlanDirty,
  setError,
}) {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isGuestMode) {
      setError("Составить туристический маршрут можно после входа через MAX.");
      return;
    }
    const cityData = findCityByName(form.city);
    if (form.maxDistanceKm && !cityData && !form.hasUserCoords) {
      setError(
        "Для ограничения расстояния выберите город из справочника или разрешите геолокацию.",
      );
      return;
    }

    let center = null;
    if (form.hasUserCoords) {
      center = { lat: Number(userCoords.lat), lng: Number(userCoords.lng) };
    } else if (cityData) {
      center = { lat: cityData.lat, lng: cityData.lng };
    }

    setLoading(true);
    setError("");
    const request = {
      city: form.city,
      date: form.date,
      days: Math.max(1, Math.min(7, Number(form.days) || 1)),
      interests: form.interests,
      budget: form.budget,
      maxDistanceKm: form.maxDistanceKm || null,
      center,
      query: form.query.trim(),
    };
    try {
      const generated = await store.tourist.generatePlan(request);
      setPlan({
        ...request,
        ...generated,
        savedAt: null,
        selectedOptionId: generated.options[0]?.id || null,
        offlinePinned,
      });
      setIsReplanning(false);
      markPlanDirty();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Не удалось составить план. Попробуйте ещё раз.",
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
}
