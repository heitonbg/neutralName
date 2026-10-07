import { useEffect, useState } from "react";
import { cityStorage } from "../utils/cityStorage.js";
import { storage } from "../utils/storage.js";

function isSavedCity(value) {
  return (
    value?.name &&
    Number.isFinite(Number(value.lat)) &&
    Number.isFinite(Number(value.lng))
  );
}

export function useAppPreferences(defaultCity) {
  const [likedIds, setLikedIds] = useState(() => storage.getLiked());
  const [selectedCity, setSelectedCity] = useState(() => {
    const saved = cityStorage.get();
    return isSavedCity(saved) ? saved : defaultCity;
  });
  const [sortBy, setSortBy] = useState(() => storage.getSort());
  const [notificationsOn, setNotificationsOn] = useState(() =>
    storage.getNotifications(),
  );
  const [theme, setTheme] = useState(() => storage.getTheme());

  useEffect(() => {
    storage.setLiked(likedIds);
  }, [likedIds]);

  useEffect(() => {
    cityStorage.set(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    storage.setSort(sortBy);
  }, [sortBy]);

  useEffect(() => {
    storage.setNotifications(notificationsOn);
  }, [notificationsOn]);

  useEffect(() => {
    storage.setTheme(theme);
  }, [theme]);

  return {
    likedIds,
    setLikedIds,
    selectedCity,
    setSelectedCity,
    sortBy,
    setSortBy,
    notificationsOn,
    setNotificationsOn,
    theme,
    setTheme,
  };
}
