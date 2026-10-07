import { useAppRouteEffects } from "./useAppRouteEffects.js";
import { useAppSessionEffects } from "./useAppSessionEffects.js";
import { useNearestCitySelection } from "./useNearestCitySelection.js";
import { useAppUiEffects } from "./useAppUiEffects.js";

export function useAppLifecycleEffects({
  store,
  location,
  navigate,
  userId,
  isMobile,
  state,
  navigation,
  pushToast,
  track,
}) {
  useAppRouteEffects({
    location,
    navigate,
    store,
    eventsRef: navigation.eventsRef,
    routeEventId: navigation.routeEventId,
    routeEventIdRef: navigation.routeEventIdRef,
    routeEditEventId: navigation.routeEditEventId,
    routeEditEventIdRef: navigation.routeEditEventIdRef,
    routeParticipantsEventId: navigation.routeParticipantsEventId,
    routeParticipantsEventIdRef: navigation.routeParticipantsEventIdRef,
    routeOrganizerId: navigation.routeOrganizerId,
    routeOrganizerIdRef: navigation.routeOrganizerIdRef,
    routeUserId: navigation.routeUserId,
    routeUserIdRef: navigation.routeUserIdRef,
    selectedEvent: state.selectedEvent,
    setSelectedEvent: state.setSelectedEvent,
    userId,
    setEditingEvent: state.setEditingEvent,
    setParticipantsEvent: state.setParticipantsEvent,
    setParticipantProfiles: state.setParticipantProfiles,
    setLoadingParticipants: state.setLoadingParticipants,
    selectedOrganizer: state.selectedOrganizer,
    setSelectedOrganizer: state.setSelectedOrganizer,
    selectedPerson: state.selectedPerson,
    setSelectedPerson: state.setSelectedPerson,
    pushToast,
  });

  const sessionEffects = useAppSessionEffects({
    store,
    userId,
    user: state.user,
    isMobile,
    setUser: state.setUser,
    setUserCoords: state.setUserCoords,
    profile: state.profile,
    setProfile: state.setProfile,
    track,
    pushToast,
  });

  useNearestCitySelection({
    isMobile,
    userCoords: state.userCoords,
    hasSavedCity: store.session.hasSavedCity,
    profileCity: state.profile.city,
    setSelectedCity: state.setSelectedCity,
    pushToast,
  });

  useAppUiEffects({
    theme: state.theme,
    selectedEvent: state.selectedEvent,
    store,
    pushToast,
  });

  return sessionEffects;
}
