import { useEffect, useRef } from 'react';
import { getEventStatus } from '../utils/eventFilters.js';
import { isEventOwner } from '../utils/eventOwnership.js';

export function useAppRouteEffects({
  location,
  navigate,
  store,
  eventsRef,
  routeEventId,
  routeEventIdRef,
  routeEditEventId,
  routeEditEventIdRef,
  routeParticipantsEventId,
  routeParticipantsEventIdRef,
  routeOrganizerId,
  routeOrganizerIdRef,
  routeUserId,
  routeUserIdRef,
  selectedEvent,
  setSelectedEvent,
  userId,
  setEditingEvent,
  setParticipantsEvent,
  setParticipantProfiles,
  setLoadingParticipants,
  selectedOrganizer,
  setSelectedOrganizer,
  selectedPerson,
  setSelectedPerson,
  pushToast,
}) {
  const requestedRouteEventId = useRef(null);
  const requestedEditEventId = useRef(null);

  useEffect(() => {
    if (!routeEventId) {
      requestedRouteEventId.current = null;
      if (selectedEvent?.id != null) setSelectedEvent(null);
      return;
    }
    if (requestedRouteEventId.current === routeEventId) return;
    requestedRouteEventId.current = routeEventId;
    if (selectedEvent?.id === routeEventId) return;

    const cachedEvent = eventsRef.current.find(
      (event) => Number(event.id) === routeEventId,
    );
    if (cachedEvent) {
      setSelectedEvent(cachedEvent);
      return;
    }

    store.events.ensure(routeEventId)
      .then((event) => {
        if (routeEventIdRef.current === routeEventId) setSelectedEvent(event);
      })
      .catch((error) => {
        if (routeEventIdRef.current !== routeEventId) return;
        requestedRouteEventId.current = null;
        pushToast(error.message || 'Не удалось загрузить событие', 'error');
        navigate('/', {
          replace: true,
          state: location.state?.startedFromMax
            ? { startedFromMax: true }
            : undefined,
        });
      });
  }, [
    location.state,
    eventsRef,
    navigate,
    pushToast,
    routeEventId,
    routeEventIdRef,
    selectedEvent?.id,
    setSelectedEvent,
    store,
  ]);

  useEffect(() => {
    if (!routeEditEventId) {
      requestedEditEventId.current = null;
      if (location.pathname !== '/events/new') setEditingEvent(null);
      return;
    }
    if (!userId) return;

    const applyEditableEvent = (event) => {
      if (routeEditEventIdRef.current !== routeEditEventId) return;
      if (
        !event ||
        !isEventOwner(event, userId) ||
        getEventStatus(event) === 'past'
      ) {
        pushToast('Событие нельзя редактировать', 'error');
        navigate('/my', { replace: true });
        return;
      }
      setEditingEvent(event);
    };

    const cachedEvent = eventsRef.current.find(
      (event) => Number(event.id) === routeEditEventId,
    );
    if (cachedEvent) {
      applyEditableEvent(cachedEvent);
      return;
    }
    if (requestedEditEventId.current === routeEditEventId) return;

    requestedEditEventId.current = routeEditEventId;
    store.events.ensure(routeEditEventId)
      .then(applyEditableEvent)
      .catch((error) => {
        if (routeEditEventIdRef.current !== routeEditEventId) return;
        pushToast(error.message || 'Не удалось загрузить событие', 'error');
        navigate('/my', { replace: true });
      });
  }, [
    location.pathname,
    eventsRef,
    navigate,
    pushToast,
    routeEditEventId,
    routeEditEventIdRef,
    setEditingEvent,
    store,
    userId,
  ]);

  useEffect(() => {
    if (!routeParticipantsEventId) {
      setParticipantsEvent(null);
      setParticipantProfiles([]);
      return undefined;
    }

    let isCurrent = true;
    setLoadingParticipants(true);
    setParticipantProfiles([]);
    const cachedEvent = eventsRef.current.find(
      (event) => Number(event.id) === routeParticipantsEventId,
    );
    Promise.all([
      cachedEvent
        ? Promise.resolve(cachedEvent)
        : store.events.ensure(routeParticipantsEventId),
      store.events.loadParticipants(routeParticipantsEventId),
    ])
      .then(([event, participants]) => {
        if (
          !isCurrent ||
          routeParticipantsEventIdRef.current !== routeParticipantsEventId
        ) {
          return;
        }
        if (!event) throw new Error('Событие не найдено');
        setParticipantsEvent(event);
        setParticipantProfiles(participants);
      })
      .catch((error) => {
        if (
          !isCurrent ||
          routeParticipantsEventIdRef.current !== routeParticipantsEventId
        ) {
          return;
        }
        pushToast(error.message || 'Не удалось загрузить участников', 'error');
        if (location.state?.background) navigate(-1);
        else navigate('/', { replace: true });
      })
      .finally(() => {
        if (isCurrent) setLoadingParticipants(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [
    location.state,
    eventsRef,
    navigate,
    pushToast,
    routeParticipantsEventId,
    routeParticipantsEventIdRef,
    setLoadingParticipants,
    setParticipantProfiles,
    setParticipantsEvent,
    store,
  ]);

  useEffect(() => {
    if (!routeOrganizerId) {
      setSelectedOrganizer(null);
      return undefined;
    }
    if (String(selectedOrganizer?.id) === String(routeOrganizerId)) return undefined;

    let isCurrent = true;
    store.session.loadUserProfile(routeOrganizerId)
      .then((person) => {
        if (isCurrent && routeOrganizerIdRef.current === routeOrganizerId) {
          setSelectedOrganizer(person);
        }
      })
      .catch((error) => {
        if (!isCurrent || routeOrganizerIdRef.current !== routeOrganizerId)
          return;
        pushToast(error.message || 'Не удалось загрузить профиль', 'error');
        if (location.state?.background) navigate(-1);
        else navigate('/', { replace: true });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    location.state,
    navigate,
    pushToast,
    routeOrganizerId,
    routeOrganizerIdRef,
    selectedOrganizer?.id,
    setSelectedOrganizer,
    store,
  ]);

  useEffect(() => {
    if (!routeUserId) {
      setSelectedPerson(null);
      return undefined;
    }
    if (Number(selectedPerson?.id) === routeUserId) return undefined;

    let isCurrent = true;
    store.session.loadUserProfile(routeUserId)
      .then((person) => {
        if (isCurrent && routeUserIdRef.current === routeUserId) {
          setSelectedPerson(person);
        }
      })
      .catch((error) => {
        if (!isCurrent || routeUserIdRef.current !== routeUserId) return;
        pushToast(error.message || 'Не удалось загрузить профиль', 'error');
        if (location.state?.background) navigate(-1);
        else navigate('/', { replace: true });
      });

    return () => {
      isCurrent = false;
    };
  }, [
    location.state,
    navigate,
    pushToast,
    routeUserId,
    routeUserIdRef,
    selectedPerson?.id,
    setSelectedPerson,
    store,
  ]);
}
