import { useCallback } from "react";

export function useEntityNavigation({
  location,
  navigate,
  store,
  track,
  routeOrganizerIdRef,
  routeUserIdRef,
  setSelectedEvent,
  setSelectedOrganizer,
  setParticipantsEvent,
  setParticipantProfiles,
  setSelectedPerson,
}) {
  const handleEventClick = useCallback(
    (event) => {
      track("event_opened", { eventId: event.id });
      setSelectedOrganizer(null);
      setSelectedEvent(event);
      const background = location.state?.background || location;
      navigate(`/events/${event.id}`, { state: { background } });
    },
    [location, navigate, setSelectedEvent, setSelectedOrganizer, track],
  );

  const handleOpenFriendProfile = useCallback(
    async (person) => {
      if (!person?.id) return;
      setSelectedPerson(person);
      const background = location.state?.background || location;
      navigate(`/users/${person.id}`, { state: { background } });
      try {
        const fresh = await store.session.loadUserProfile(person.id);
        if (fresh) {
          setSelectedPerson((current) =>
            current && String(current.id) === String(person.id)
              ? { ...current, ...fresh }
              : current,
          );
        }
      } catch (error) {
        console.warn("Не удалось загрузить профиль друга", error);
      }
    },
    [location, navigate, setSelectedPerson, store],
  );

  const handleOpenOrganizer = useCallback(
    async (organizer) => {
      if (!organizer?.id) return;
      track("organizer_opened", { organizerId: organizer.id });
      setSelectedOrganizer(organizer);
      setSelectedEvent(null);
      const background = location.state?.background || location;
      navigate(`/organizers/${organizer.id}`, { state: { background } });
      try {
        const fresh = await store.session.loadUserProfile(organizer.id);
        if (fresh && String(routeOrganizerIdRef.current) === String(organizer.id)) {
          setSelectedOrganizer(fresh);
        }
      } catch (error) {
        console.warn("Не удалось загрузить профиль организатора", error);
      }
    },
    [
      location,
      navigate,
      routeOrganizerIdRef,
      setSelectedEvent,
      setSelectedOrganizer,
      store,
      track,
    ],
  );

  const handleOpenParticipants = useCallback(
    (event) => {
      if (!event?.id) return;
      setSelectedEvent(null);
      setParticipantsEvent(null);
      setParticipantProfiles([]);
      navigate(`/events/${event.id}/participants`, {
        state: { background: location },
      });
    },
    [
      location,
      navigate,
      setParticipantProfiles,
      setParticipantsEvent,
      setSelectedEvent,
    ],
  );

  const handleOpenParticipantProfile = useCallback(
    async (person) => {
      if (!person?.id) return;
      setParticipantsEvent(null);
      setSelectedPerson(person);
      navigate(`/users/${person.id}`, { state: { background: location } });
      try {
        const fresh = await store.session.loadUserProfile(person.id);
        if (fresh && routeUserIdRef.current === Number(person.id)) {
          setSelectedPerson(fresh);
        }
      } catch (error) {
        console.warn("Не удалось загрузить профиль участника", error);
      }
    },
    [location, navigate, routeUserIdRef, setParticipantsEvent, setSelectedPerson, store],
  );

  return {
    handleEventClick,
    handleOpenFriendProfile,
    handleOpenOrganizer,
    handleOpenParticipants,
    handleOpenParticipantProfile,
  };
}
