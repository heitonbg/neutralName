import { useCallback } from "react";
import { isEventOwner } from "../utils/eventOwnership.js";
import { getEventStatus } from "../utils/eventFilters.js";

export function useEventConfirmationActions({
  store,
  userId,
  joinedIds,
  routeEventId,
  closeEvent,
  pushToast,
  loadBootstrap,
  handleLeaveEvent,
  pendingDelete,
  deleting,
  pendingLeave,
  setSelectedEvent,
  setPendingDelete,
  setDeleting,
  setDeleteError,
  setPendingLeave,
}) {
  const requestDelete = useCallback(
    (event) => {
      if (!isEventOwner(event, userId)) return;
      if (getEventStatus(event) === "past") {
        pushToast("Завершённое событие нельзя удалить", "error");
        return;
      }
      setDeleteError("");
      setPendingDelete(event);
    },
    [pushToast, setDeleteError, setPendingDelete, userId],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting || !isEventOwner(pendingDelete, userId)) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await store.events.remove(pendingDelete.id);
      const id = pendingDelete.id;
      setSelectedEvent((event) => (event?.id === id ? null : event));
      if (Number(routeEventId) === Number(id)) closeEvent();
      setPendingDelete(null);
      pushToast("Событие удалено");
      loadBootstrap();
    } catch (error) {
      setDeleteError(
        error.message || "Не удалось удалить событие. Попробуйте ещё раз.",
      );
    } finally {
      setDeleting(false);
    }
  }, [
    closeEvent,
    deleting,
    loadBootstrap,
    pendingDelete,
    pushToast,
    routeEventId,
    setDeleteError,
    setDeleting,
    setPendingDelete,
    setSelectedEvent,
    store,
    userId,
  ]);

  const requestLeave = useCallback(
    (event) => {
      if (!event || isEventOwner(event, userId)) return;
      if (!joinedIds.includes(event.id)) return;
      setPendingLeave(event);
    },
    [joinedIds, setPendingLeave, userId],
  );

  const confirmLeave = useCallback(() => {
    if (!pendingLeave) return;
    const event = pendingLeave;
    setPendingLeave(null);
    handleLeaveEvent(event);
  }, [handleLeaveEvent, pendingLeave, setPendingLeave]);

  return { requestDelete, confirmDelete, requestLeave, confirmLeave };
}
