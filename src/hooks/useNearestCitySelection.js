import { useEffect } from "react";

export function useNearestCitySelection({
  isMobile,
  userCoords,
  hasSavedCity,
  profileCity,
  setSelectedCity,
  pushToast,
}) {
  useEffect(() => {
    if (!isMobile || !userCoords || hasSavedCity || profileCity) return undefined;

    let isCurrent = true;
    import("../utils/citySearch.js")
      .then(({ findNearestCity }) => {
        if (!isCurrent) return;
        const nearest = findNearestCity(userCoords.lat, userCoords.lng, 150);
        if (nearest?.city) {
          setSelectedCity(nearest.city);
          pushToast(`Определили город: ${nearest.city.name}`, "info");
        }
      })
      .catch((error) => {
        console.error("Не удалось загрузить справочник городов", error);
      });

    return () => {
      isCurrent = false;
    };
  }, [
    hasSavedCity,
    isMobile,
    profileCity,
    pushToast,
    setSelectedCity,
    userCoords,
  ]);
}
