import { useCallback } from "react";
import { isEventOwner } from "../utils/eventOwnership";
import { maxBridge } from "../utils/maxBridge";

export function useEventActions({
  store,
  isGuestMode,
  userId,
  user,
  profile,
  selectedCity,
  joinedIds,
  pendingActions,
  setSelectedEvent,
  setLikedIds,
  setEditingEvent,
  setActiveTab,
  pushToast,
  loadBootstrap,
  track,
}) {
  const handleJoinEvent = useCallback(
    async (event) => {
      if (isGuestMode) {
        pushToast("В гостевом режиме можно только просматривать события", "info");
        return;
      }
      if (!userId) {
        pushToast("Подождите, загружаем профиль…", "info");
        return;
      }
      if (isEventOwner(event, userId) || joinedIds.includes(event.id)) return;
      if (pendingActions[event.id]) return;
      if (event.maxParticipants && event.participants >= event.maxParticipants) {
        pushToast("Мест больше нет", "error");
        return;
      }

      try {
        const userProfile = {
          name: user?.first_name
            ? `${user.first_name} ${user.last_name || ""}`.trim()
            : "Вы",
          photo_url: user?.photo_url || null,
          age: profile.age ?? null,
          city: profile.city || selectedCity?.name || null,
          about: profile.about || null,
        };
        const result = await store.events.join(event, userProfile);

        maxBridge.haptic("medium");
        if (typeof result.participants === "number") {
          setSelectedEvent((current) =>
            current?.id === event.id
              ? { ...current, participants: result.participants }
              : current,
          );
        }
        track("join_success", { eventId: event.id });
        pushToast(`Вы участвуете: «${event.title}»`);
        loadBootstrap();
      } catch (error) {
        pushToast(error.message || "Не удалось присоединиться", "error");
      }
    },
    [
      isGuestMode,
      userId,
      joinedIds,
      pendingActions,
      user,
      profile,
      selectedCity,
      store,
      setSelectedEvent,
      track,
      pushToast,
      loadBootstrap,
    ],
  );

  const handleLeaveEvent = useCallback(
    async (event) => {
      if (isGuestMode) {
        pushToast("В гостевом режиме можно только просматривать события", "info");
        return;
      }
      if (!userId) return;
      if (isEventOwner(event, userId) || !joinedIds.includes(event.id)) return;
      if (pendingActions[event.id]) return;

      try {
        const result = await store.events.leave(event);
        if (typeof result.participants === "number") {
          setSelectedEvent((current) =>
            current?.id === event.id
              ? { ...current, participants: result.participants }
              : current,
          );
        }
        pushToast(`Вы отменили участие: «${event.title}»`);
        loadBootstrap();
      } catch (error) {
        pushToast(error.message || "Не удалось отменить участие", "error");
      }
    },
    [
      isGuestMode,
      userId,
      joinedIds,
      pendingActions,
      store,
      setSelectedEvent,
      pushToast,
      loadBootstrap,
    ],
  );

  const handleToggleLike = useCallback(
    (eventId) => {
      setLikedIds((current) =>
        current.includes(eventId)
          ? current.filter((id) => id !== eventId)
          : [...current, eventId],
      );
    },
    [setLikedIds],
  );

  const handleCreateEvent = useCallback(
    async (newEvent, editingId) => {
      if (isGuestMode) {
        pushToast("Создание событий доступно после входа через MAX", "info");
        throw new Error("Гостевой режим доступен только для просмотра");
      }
      if (!userId) {
        pushToast("Подождите, загружаем профиль…", "info");
        throw new Error("Профиль ещё не загружен");
      }
      try {
        if (editingId) {
          const updated = await store.events.save(newEvent, editingId);
          setSelectedEvent((current) =>
            current?.id === editingId ? updated : current,
          );
          setEditingEvent(null);
          setActiveTab("my");
          pushToast(`Событие «${updated.title}» обновлено`);
          loadBootstrap();
          return;
        }
        const created = await store.events.save(newEvent);
        setActiveTab("my");
        track("event_created", { title: created.title });
        maxBridge.haptic("success");
        pushToast(`Событие «${created.title}» создано`);
        loadBootstrap();
      } catch (error) {
        pushToast(error.message || "Не удалось сохранить событие", "error");
        throw error;
      }
    },
    [
      isGuestMode,
      userId,
      store,
      setSelectedEvent,
      setEditingEvent,
      setActiveTab,
      pushToast,
      loadBootstrap,
      track,
    ],
  );

  const handleAddReview = useCallback(
    async (review) => {
      if (isGuestMode) {
        pushToast("Оставить отзыв можно после входа через MAX", "info");
        throw new Error("Гостевой режим доступен только для просмотра");
      }
      const created = await store.events.addReview(review);
      pushToast("Спасибо за отзыв!");
      return created;
    },
    [isGuestMode, store, pushToast],
  );

  return {
    handleJoinEvent,
    handleLeaveEvent,
    handleToggleLike,
    handleCreateEvent,
    handleAddReview,
  };
}
