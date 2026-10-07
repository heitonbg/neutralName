import { useCallback, useEffect, useRef } from "react";
import {
  getActiveTab,
  getEditEventIdFromPath,
  getEventIdFromPath,
  getOrganizerIdFromPath,
  getParticipantsEventIdFromPath,
  getUserIdFromPath,
  isKnownRoute,
  TAB_PATHS,
} from "../app/navigation.js";

export function useAppNavigation({
  location,
  navigate,
  events,
  setSelectedEvent,
  setSelectedOrganizer,
  setParticipantsEvent,
  setSelectedPerson,
  setIsTouristPlanOpen,
}) {
  const activeTab = getActiveTab(location);
  const routeEventId = getEventIdFromPath(location.pathname);
  const routeEditEventId = getEditEventIdFromPath(location.pathname);
  const routeParticipantsEventId = getParticipantsEventIdFromPath(
    location.pathname,
  );
  const routeOrganizerId = getOrganizerIdFromPath(location.pathname);
  const routeUserId = getUserIdFromPath(location.pathname);
  const routeEventIdRef = useRef(routeEventId);
  routeEventIdRef.current = routeEventId;
  const routeEditEventIdRef = useRef(routeEditEventId);
  routeEditEventIdRef.current = routeEditEventId;
  const routeParticipantsEventIdRef = useRef(routeParticipantsEventId);
  routeParticipantsEventIdRef.current = routeParticipantsEventId;
  const routeOrganizerIdRef = useRef(routeOrganizerId);
  routeOrganizerIdRef.current = routeOrganizerId;
  const routeUserIdRef = useRef(routeUserId);
  routeUserIdRef.current = routeUserId;
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const setActiveTab = useCallback(
    (tab) => {
      setSelectedEvent(null);
      setSelectedOrganizer(null);
      setParticipantsEvent(null);
      setSelectedPerson(null);
      navigate(TAB_PATHS[tab] || TAB_PATHS.feed);
    },
    [
      navigate,
      setParticipantsEvent,
      setSelectedEvent,
      setSelectedOrganizer,
      setSelectedPerson,
    ],
  );

  const closeEvent = useCallback(() => {
    setSelectedEvent(null);
    if (!routeEventId) return;
    if (location.state?.background) navigate(-1);
    else {
      navigate("/", {
        replace: true,
        state: location.state?.startedFromMax
          ? { startedFromMax: true }
          : undefined,
      });
    }
  }, [location.state, navigate, routeEventId, setSelectedEvent]);

  const closeTouristPlan = useCallback(() => {
    setIsTouristPlanOpen(false);
    if (location.pathname !== "/tourist") return;
    if (location.state?.background) navigate(-1);
    else navigate("/", { replace: true });
  }, [location.pathname, location.state, navigate, setIsTouristPlanOpen]);

  const closeParticipants = useCallback(() => {
    setParticipantsEvent(null);
    if (!routeParticipantsEventId) return;
    if (location.state?.background) navigate(-1);
    else navigate(`/events/${routeParticipantsEventId}`, { replace: true });
  }, [location.state, navigate, routeParticipantsEventId, setParticipantsEvent]);

  const closeOrganizer = useCallback(() => {
    setSelectedOrganizer(null);
    if (!routeOrganizerId) return;
    if (location.state?.background) navigate(-1);
    else navigate("/", { replace: true });
  }, [location.state, navigate, routeOrganizerId, setSelectedOrganizer]);

  const closeUserProfile = useCallback(() => {
    setSelectedPerson(null);
    if (!routeUserId) return;
    if (location.state?.background) navigate(-1);
    else navigate("/", { replace: true });
  }, [location.state, navigate, routeUserId, setSelectedPerson]);

  useEffect(() => {
    setIsTouristPlanOpen(location.pathname === "/tourist");
  }, [location.pathname, setIsTouristPlanOpen]);

  useEffect(() => {
    if (!isKnownRoute(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  return {
    activeTab,
    routeEventId,
    routeEditEventId,
    routeParticipantsEventId,
    routeOrganizerId,
    routeUserId,
    routeEventIdRef,
    routeEditEventIdRef,
    routeParticipantsEventIdRef,
    routeOrganizerIdRef,
    routeUserIdRef,
    eventsRef,
    setActiveTab,
    closeEvent,
    closeTouristPlan,
    closeParticipants,
    closeOrganizer,
    closeUserProfile,
  };
}
