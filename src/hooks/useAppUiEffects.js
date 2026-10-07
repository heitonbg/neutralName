import { useEffect } from "react";

export function useAppUiEffects({ theme, selectedEvent, store, pushToast }) {
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const selectedEventId = selectedEvent?.id;
  useEffect(() => {
    if (selectedEventId == null) return undefined;

    let active = true;
    store.events.loadReviews(selectedEventId).catch((error) => {
      if (active) {
        pushToast(error.message || "Не удалось загрузить отзывы", "error");
      }
    });

    return () => {
      active = false;
    };
  }, [selectedEventId, pushToast, store]);
}
