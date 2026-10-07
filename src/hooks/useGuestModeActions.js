import { useCallback } from "react";

export function useGuestModeActions({ store, pushToast }) {
  const enterGuestMode = useCallback(() => {
    const persisted = store.ui.setGuestMode(true);
    if (!persisted) {
      pushToast("Не удалось сохранить гостевой режим в этом браузере", "error");
    }
    pushToast(
      "Гостевой режим включён: данные не отправляются на сервер",
      "info",
    );
  }, [pushToast, store]);

  const exitGuestMode = useCallback(() => {
    const persisted = store.ui.setGuestMode(false);
    if (!persisted) {
      pushToast("Не удалось очистить сохранённый гостевой режим", "error");
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("guest");
    window.history.replaceState(window.history.state, "", url);
  }, [pushToast, store]);

  return { enterGuestMode, exitGuestMode };
}
