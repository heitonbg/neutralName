import { useStoreState } from "../store/useStoreState.js";

export function useAppStoreState(store) {
  const [events] = useStoreState(store.events, "events");
  const [loading] = useStoreState(store.events, "loading");
  const [searchQuery, setSearchQuery] = useStoreState(
    store.filters,
    "searchQuery",
  );
  const [quickFilter, setQuickFilter] = useStoreState(
    store.filters,
    "quickFilter",
  );
  const [mapTimeFilter, setMapTimeFilter] = useStoreState(
    store.filters,
    "mapTimeFilter",
  );
  const [isFiltersOpen, setIsFiltersOpen] = useStoreState(
    store.ui,
    "isFiltersOpen",
  );
  const [isMenuOpen, setIsMenuOpen] = useStoreState(store.ui, "isMenuOpen");
  const [filters, setFilters] = useStoreState(store.filters, "filters");
  const [selectedEvent, setSelectedEvent] = useStoreState(
    store.ui,
    "selectedEvent",
  );
  const [selectedOrganizer, setSelectedOrganizer] = useStoreState(
    store.ui,
    "selectedOrganizer",
  );
  const [participantsEvent, setParticipantsEvent] = useStoreState(
    store.ui,
    "participantsEvent",
  );
  const [participantProfiles, setParticipantProfiles] = useStoreState(
    store.ui,
    "participantProfiles",
  );
  const [loadingParticipants, setLoadingParticipants] = useStoreState(
    store.ui,
    "loadingParticipants",
  );
  const [selectedPerson, setSelectedPerson] = useStoreState(
    store.ui,
    "selectedPerson",
  );
  const [joinedIds] = useStoreState(store.events, "joinedIds");
  const [participatedIds] = useStoreState(store.events, "participatedIds");
  const [createdIds] = useStoreState(store.events, "createdIds");
  const [likedIds, setLikedIds] = useStoreState(store.filters, "likedIds");
  const [selectedCity, setSelectedCity] = useStoreState(
    store.session,
    "selectedCity",
  );
  const [sortBy, setSortBy] = useStoreState(store.filters, "sortBy");
  const [notificationsOn, setNotificationsOn] = useStoreState(
    store.session,
    "notificationsOn",
  );
  const [theme, setTheme] = useStoreState(store.ui, "theme");
  const [user, setUser] = useStoreState(store.session, "user");
  const [isGuestMode] = useStoreState(store.ui, "isGuestMode");
  const [userCoords, setUserCoords] = useStoreState(
    store.session,
    "userCoords",
  );
  const [toasts] = useStoreState(store.ui, "toasts");
  const [lastCreatedEventId] = useStoreState(
    store.events,
    "lastCreatedEventId",
  );
  const [isCityOpen, setIsCityOpen] = useStoreState(store.ui, "isCityOpen");
  const [isTouristPlanOpen, setIsTouristPlanOpen] = useStoreState(
    store.ui,
    "isTouristPlanOpen",
  );
  const [touristMapRoute, setTouristMapRoute] = useStoreState(
    store.tourist,
    "touristMapRoute",
  );
  const [pendingDelete, setPendingDelete] = useStoreState(
    store.ui,
    "pendingDelete",
  );
  const [deleting, setDeleting] = useStoreState(store.ui, "deleting");
  const [deleteError, setDeleteError] = useStoreState(store.ui, "deleteError");
  const [pendingLeave, setPendingLeave] = useStoreState(
    store.ui,
    "pendingLeave",
  );
  const [editingEvent, setEditingEvent] = useStoreState(
    store.ui,
    "editingEvent",
  );
  const [pendingActions] = useStoreState(store.events, "pendingActions");
  const [reviewsByEvent] = useStoreState(store.events, "reviewsByEvent");
  const [friendsCount] = useStoreState(store.friends, "friendsCount");
  const [incomingFriendsCount] = useStoreState(
    store.friends,
    "incomingFriendsCount",
  );
  const [profile, setProfile] = useStoreState(store.session, "profile");

  return {
    events,
    loading,
    searchQuery,
    setSearchQuery,
    quickFilter,
    setQuickFilter,
    mapTimeFilter,
    setMapTimeFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    isMenuOpen,
    setIsMenuOpen,
    filters,
    setFilters,
    selectedEvent,
    setSelectedEvent,
    selectedOrganizer,
    setSelectedOrganizer,
    participantsEvent,
    setParticipantsEvent,
    participantProfiles,
    setParticipantProfiles,
    loadingParticipants,
    setLoadingParticipants,
    selectedPerson,
    setSelectedPerson,
    joinedIds,
    participatedIds,
    createdIds,
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
    user,
    setUser,
    isGuestMode,
    userCoords,
    setUserCoords,
    toasts,
    lastCreatedEventId,
    isCityOpen,
    setIsCityOpen,
    isTouristPlanOpen,
    setIsTouristPlanOpen,
    touristMapRoute,
    setTouristMapRoute,
    pendingDelete,
    setPendingDelete,
    deleting,
    setDeleting,
    deleteError,
    setDeleteError,
    pendingLeave,
    setPendingLeave,
    editingEvent,
    setEditingEvent,
    pendingActions,
    reviewsByEvent,
    friendsCount,
    incomingFriendsCount,
    profile,
    setProfile,
  };
}
