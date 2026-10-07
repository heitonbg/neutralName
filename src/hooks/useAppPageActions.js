import { useCallback } from "react";
import { isEventOwner } from "../utils/eventOwnership.js";
import { getEventStatus } from "../utils/eventFilters.js";

export function useAppPageActions({
  location,
  navigate,
  userId,
  routeEditEventId,
  setEditingEvent,
  setSelectedEvent,
  setActiveTab,
  setFilters,
  setQuickFilter,
  pushToast,
  track,
}) {
  const handleEditEvent = useCallback(
    (event) => {
      if (!isEventOwner(event, userId)) return;
      if (getEventStatus(event) === "past") {
        pushToast("Завершённое событие нельзя редактировать", "error");
        return;
      }
      setEditingEvent(event);
      setSelectedEvent(null);
      navigate(`/events/${event.id}/edit`, {
        state: { background: location.state?.background || location },
      });
    },
    [
      location,
      navigate,
      pushToast,
      setEditingEvent,
      setSelectedEvent,
      userId,
    ],
  );

  const handleApplyFilters = useCallback(
    (filters) => {
      setFilters(filters);
      setQuickFilter(null);
    },
    [setFilters, setQuickFilter],
  );

  const handleOpenChat = useCallback(
    (event) => {
      track("chat_opened", { eventId: event.id });
      const chatUrl = String(event.maxChatUrl || "").trim();
      if (/^https:\/\//i.test(chatUrl)) {
        window.open(chatUrl, "_blank", "noopener,noreferrer");
      } else {
        pushToast("Организатор пока не добавил ссылку на чат", "info");
      }
    },
    [pushToast, track],
  );

  const handleCreateFromEmptyState = useCallback(() => {
    track("create_started", { source: "empty_feed" });
    setEditingEvent(null);
    setActiveTab("create");
  }, [setActiveTab, setEditingEvent, track]);

  const handleCancelCreate = useCallback(() => {
    setEditingEvent(null);
    if (routeEditEventId && location.state?.background) {
      navigate(-1);
    } else if (routeEditEventId) {
      navigate("/my", { replace: true });
    } else {
      setActiveTab("feed");
    }
  }, [
    location.state?.background,
    navigate,
    routeEditEventId,
    setActiveTab,
    setEditingEvent,
  ]);

  const handleCreateFromNavigation = useCallback(() => {
    setEditingEvent(null);
    setActiveTab("create");
  }, [setActiveTab, setEditingEvent]);

  return {
    handleEditEvent,
    handleApplyFilters,
    handleOpenChat,
    handleCreateFromEmptyState,
    handleCancelCreate,
    handleCreateFromNavigation,
  };
}
