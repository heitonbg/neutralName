import { maxBridge } from "../utils/maxBridge.js";

const BOT_USERNAME = String(
  import.meta.env.VITE_BOT_USERNAME || "t280_hakaton_max_bot",
).replace(/^@/, "");

export function useAppViewModel({
  location,
  navigate,
  state,
  data,
  actions,
  navigation,
}) {
  const {
    activeTab,
    isGuestMode,
    userId,
    user,
    profile,
    selectedCity,
    isMenuOpen,
    searchQuery,
    quickFilter,
    filters,
    sortBy,
    setSortBy,
    isFiltersOpen,
    isCityOpen,
    isTouristPlanOpen,
    selectedEvent,
    selectedOrganizer,
    participantsEvent,
    participantProfiles,
    loadingParticipants,
    selectedPerson,
    pendingDelete,
    deleting,
    deleteError,
    pendingLeave,
    editingEvent,
    userCoords,
    theme,
    notificationsOn,
    likedIds,
    joinedIds,
    participatedIds,
    createdIds,
    pendingActions,
    toasts,
    reviewsByEvent,
    lastCreatedEventId,
    touristMapRoute,
  } = state;
  const {
    events,
    loading,
    referenceCoords,
    visibleQuickFilters,
    activeFiltersCount,
    filteredEvents,
    mapEvents,
    mapTimeFilter,
    friendsCount,
    incomingFriendsCount,
    savedTouristPlan,
  } = data;
  const {
    setIsMenuOpen,
    setIsCityOpen,
    setIsFiltersOpen,
    setQuickFilter,
    setSearchQuery,
    setMapTimeFilter,
    setTouristMapRoute,
    setFilters,
    setPendingDelete,
    setPendingLeave,
    requestDelete,
    requestLeave,
    confirmDelete,
    confirmLeave,
    handleJoinEvent,
    handleLeaveEvent,
    handleToggleLike,
    handleCreateEvent,
    handleAddReview,
    handleEditEvent,
    handleApplyFilters,
    handleOpenChat,
    handleCreateFromEmptyState,
    handleCancelCreate,
    handleSaveProfile,
    handleToggleNotifications,
    handleToggleTheme,
    handleOpenFriendProfile,
    handleEventClick,
    handleOpenOrganizer,
    handleOpenParticipants,
    handleOpenParticipantProfile,
    handleCitySelect,
    handleFriendsChanged,
    onEnterGuestMode,
    onExitGuestMode,
    onDismissToast,
  } = actions;
  const {
    setActiveTab,
    closeEvent,
    closeTouristPlan,
    closeOrganizer,
    closeParticipants,
    closeUserProfile,
    onTrackCreate,
    onShowTouristRouteOnMap,
    onProfileEventClick,
  } = navigation;

  const isExploreTab = activeTab === "feed" || activeTab === "map";
  const isReady =
    isGuestMode ||
    Boolean(userId) ||
    activeTab === "feed" ||
    activeTab === "map";

  const headerProps = {
    activeTab,
    selectedCity,
    user,
    isMenuOpen,
    onToggleMenu: () => setIsMenuOpen((value) => !value),
    onSetActiveTab: (tab) => {
      setActiveTab(tab);
      setIsMenuOpen(false);
    },
    onOpenCityPicker: () => setIsCityOpen(true),
    referenceCoords,
    searchQuery,
    onSearchChange: setSearchQuery,
    onOpenFilters: () => setIsFiltersOpen(true),
    activeFiltersCount,
    savedTouristPlan,
    onOpenTouristPlan: () => {
      setQuickFilter(null);
      const background = location.state?.background || location;
      navigate("/tourist", { state: { background } });
    },
    visibleQuickFilters,
    quickFilter,
    onQuickFilterChange: setQuickFilter,
  };

  const pageProps = {
    activeTab,
    loading,
    isReady,
    userId,
    events,
    filteredEvents,
    mapEvents,
    mapTimeFilter,
    onMapTimeFilterChange: setMapTimeFilter,
    touristMapRoute,
    onCloseTouristRoute: () => setTouristMapRoute(null),
    onDelete: requestDelete,
    onJoin: handleJoinEvent,
    onLeave: handleLeaveEvent,
    onLeaveRequest: requestLeave,
    onEventClick: handleEventClick,
    joinedIds,
    participatedIds,
    likedIds,
    onToggleLike: handleToggleLike,
    pendingActions,
    activeFiltersCount,
    onResetFilters: () => {
      setFilters(null);
      setQuickFilter(null);
    },
    onCreateFromEmptyState: handleCreateFromEmptyState,
    onCreate: handleCreateEvent,
    onEdit: handleEditEvent,
    onCancelCreate: handleCancelCreate,
    userName: isGuestMode ? "Гость" : user?.first_name || user?.name,
    userPhotoUrl: user?.photo_url,
    userAge: profile.age,
    userCity: profile.city || selectedCity?.name,
    userAbout: profile.about,
    city: selectedCity?.name || "Казань",
    cityCoords: selectedCity
      ? { lat: selectedCity.lat, lng: selectedCity.lng }
      : null,
    userCoords,
    editingEvent,
    showCreatedInitially: Boolean(lastCreatedEventId),
    user: isGuestMode ? { first_name: "Гость", name: "Гость" } : user,
    profile,
    onSaveProfile: handleSaveProfile,
    createdCount: createdIds.length,
    friendsCount,
    incomingRequestsCount: incomingFriendsCount,
    onOpenFriends: () => setActiveTab("friends"),
    notificationsOn,
    onToggleNotifications: handleToggleNotifications,
    theme,
    onToggleTheme: handleToggleTheme,
    onOpenFriendProfile: handleOpenFriendProfile,
  };

  const overlayProps = {
    filtersOpen: isFiltersOpen,
    onCloseFilters: () => setIsFiltersOpen(false),
    onApplyFilters: handleApplyFilters,
    filters,
    sortBy,
    onSortChange: setSortBy,
    touristPlanOpen: isTouristPlanOpen,
    touristPlanKey: `${userId || "anonymous"}:${selectedCity?.name || ""}`,
    isGuestMode,
    selectedCity,
    savedTouristPlan,
    userId,
    userCoords,
    onCloseTouristPlan: closeTouristPlan,
    onEventClick: handleEventClick,
    onShowTouristRouteOnMap,
    selectedEvent,
    onDeleteEvent: requestDelete,
    onEditEvent: handleEditEvent,
    onCloseEvent: closeEvent,
    onJoinEvent: handleJoinEvent,
    onLeaveEvent: handleLeaveEvent,
    onLeaveRequest: requestLeave,
    onOpenChat: handleOpenChat,
    onOpenOrganizer: handleOpenOrganizer,
    onOpenParticipants: handleOpenParticipants,
    joined: Boolean(selectedEvent && joinedIds.includes(selectedEvent.id)),
    liked: Boolean(selectedEvent && likedIds.includes(selectedEvent.id)),
    onToggleLike: handleToggleLike,
    userName: isGuestMode ? "Гость" : user?.first_name || user?.name,
    reviews: selectedEvent ? reviewsByEvent[selectedEvent.id] || [] : [],
    onAddReview: handleAddReview,
    wasParticipant: Boolean(
      selectedEvent && participatedIds.includes(selectedEvent.id),
    ),
    relatedEvents: selectedEvent
      ? filteredEvents
          .filter(
            (event) =>
              event.id !== selectedEvent.id &&
              event.category === selectedEvent.category,
          )
          .slice(0, 3)
      : [],
    onShareEvent: (event) => {
      const link = `https://max.ru/${BOT_USERNAME}?startapp=event_${event.id}`;
      maxBridge.shareContent({
        text: `${event.title}\n${event.date}`,
        link,
      });
    },
    selectedOrganizer,
    organizerEvents: events.filter((event) => {
      const organizerId = event.organizerId ?? event.organizer?.id;
      return String(organizerId) === String(selectedOrganizer?.id);
    }),
    onCloseOrganizer: closeOrganizer,
    onFriendsChanged: handleFriendsChanged,
    participantsEvent,
    participantProfiles,
    loadingParticipants,
    onCloseParticipants: closeParticipants,
    onOpenParticipantProfile: handleOpenParticipantProfile,
    selectedPerson,
    profileEvents: events,
    profileReviews: Object.values(reviewsByEvent).flat(),
    onCloseUserProfile: closeUserProfile,
    onProfileEventClick,
    pendingDelete,
    deleting,
    deleteError,
    onCancelDelete: () => setPendingDelete(null),
    onConfirmDelete: confirmDelete,
    pendingLeave,
    leaveBusy: Boolean(pendingLeave && pendingActions[pendingLeave.id]),
    onCancelLeave: () => setPendingLeave(null),
    onConfirmLeave: confirmLeave,
    toasts,
    onDismissToast,
    cityPickerOpen: isCityOpen,
    onSelectCity: handleCitySelect,
    onCloseCityPicker: () => setIsCityOpen(false),
  };

  return {
    isExploreTab,
    headerProps,
    pageProps,
    overlayProps,
    onEnterGuestMode,
    onExitGuestMode,
    onTrackCreate,
  };
}
