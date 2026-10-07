import { useEffect, useRef, useState } from "react";
import { createTouristPlan, getLocalDate } from "./planModel.js";

export function useTouristPlanForm({
  initialCity,
  initialPlan,
  userCoords,
  plan,
  setPlan,
  setPlanDirty,
  setSaveStatus,
  setOfflinePinned,
}) {
  const [city, setCity] = useState(initialPlan?.city || initialCity || "");
  const [date, setDate] = useState(initialPlan?.date || getLocalDate());
  const [days, setDays] = useState(initialPlan?.days || 1);
  const [interests, setInterests] = useState(initialPlan?.interests || []);
  const [budget, setBudget] = useState(initialPlan?.budget || "any");
  const [maxDistanceKm, setMaxDistanceKm] = useState(
    initialPlan?.maxDistanceKm === undefined ? 5 : initialPlan.maxDistanceKm,
  );
  const [query, setQuery] = useState(initialPlan?.query || "");
  const formTouchedRef = useRef(false);

  useEffect(() => {
    if (plan || formTouchedRef.current) return;
    const restoredPlan = createTouristPlan(initialPlan);
    if (!restoredPlan) return;

    setCity(restoredPlan.city || initialCity || "");
    setDate(restoredPlan.date || getLocalDate());
    setDays(restoredPlan.days || 1);
    setInterests(restoredPlan.interests || []);
    setBudget(restoredPlan.budget || "any");
    setMaxDistanceKm(
      restoredPlan.maxDistanceKm === undefined ? 5 : restoredPlan.maxDistanceKm,
    );
    setQuery(restoredPlan.query || "");
    setPlan(restoredPlan);
    setPlanDirty(
      Boolean(
        restoredPlan.options?.some(
          (option) => option.removedOverlappingEventCount,
        ),
      ),
    );
    setSaveStatus(
      restoredPlan.storage === "server"
        ? "synced"
        : restoredPlan.savedAt
          ? "device"
          : "draft",
    );
    setOfflinePinned(Boolean(restoredPlan.offlinePinned));
  }, [
    initialCity,
    initialPlan,
    plan,
    setPlan,
    setPlanDirty,
    setSaveStatus,
    setOfflinePinned,
  ]);

  const hasUserCoords =
    userCoords?.lat != null &&
    userCoords?.lng != null &&
    Number.isFinite(Number(userCoords.lat)) &&
    Number.isFinite(Number(userCoords.lng));

  const sameInterests =
    plan?.interests?.length === interests.length &&
    interests.every((interest) => plan.interests.includes(interest));
  const isCurrentPlan =
    plan?.city === city &&
    plan?.date === date &&
    Number(plan.days) === Number(days) &&
    plan.budget === budget &&
    Number(plan.maxDistanceKm || 0) === Number(maxDistanceKm || 0) &&
    sameInterests &&
    plan.query === query.trim();

  return {
    city,
    setCity,
    date,
    setDate,
    days,
    setDays,
    interests,
    setInterests,
    budget,
    setBudget,
    maxDistanceKm,
    setMaxDistanceKm,
    query,
    setQuery,
    isCurrentPlan,
    hasUserCoords,
    markFormTouched: () => {
      formTouchedRef.current = true;
    },
  };
}
