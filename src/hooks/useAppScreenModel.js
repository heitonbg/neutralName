import { useFilteredEvents } from "./useFilteredEvents.js";
import { useAppViewModel } from "./useAppViewModel.js";

export function useAppScreenModel({
  location,
  navigate,
  store,
  state,
  navigation,
  actions,
  guestActions,
  track,
}) {
  const filteredData = useFilteredEvents({
    events: state.events,
    userCoords: state.userCoords,
    selectedCity: state.selectedCity,
    searchQuery: state.searchQuery,
    quickFilter: state.quickFilter,
    filters: state.filters,
    sortBy: state.sortBy,
    mapTimeFilter: state.mapTimeFilter,
    activeTab: navigation.activeTab,
  });

  const viewModel = useAppViewModel({
    location,
    navigate,
    state: {
      ...state,
      activeTab: navigation.activeTab,
    },
    data: {
      events: state.events,
      loading: state.loading,
      ...filteredData,
      mapTimeFilter: state.mapTimeFilter,
      friendsCount: state.friendsCount,
      incomingFriendsCount: state.incomingFriendsCount,
      savedTouristPlan: store.tourist.savedPlan.plan,
    },
    actions: {
      ...actions,
      onEnterGuestMode: guestActions.enterGuestMode,
      onExitGuestMode: guestActions.exitGuestMode,
      setIsMenuOpen: state.setIsMenuOpen,
      setIsCityOpen: state.setIsCityOpen,
      setIsFiltersOpen: state.setIsFiltersOpen,
      setQuickFilter: state.setQuickFilter,
      setSearchQuery: state.setSearchQuery,
      setMapTimeFilter: state.setMapTimeFilter,
      setTouristMapRoute: state.setTouristMapRoute,
      setFilters: state.setFilters,
      setPendingDelete: state.setPendingDelete,
      setPendingLeave: state.setPendingLeave,
      onDismissToast: (id) => store.ui.dismissToast(id),
    },
    navigation: {
      setActiveTab: navigation.setActiveTab,
      closeEvent: navigation.closeEvent,
      closeTouristPlan: navigation.closeTouristPlan,
      closeOrganizer: navigation.closeOrganizer,
      closeParticipants: navigation.closeParticipants,
      closeUserProfile: navigation.closeUserProfile,
      onTrackCreate: () => track("create_started", { source: "navigation" }),
      onShowTouristRouteOnMap: (route) => {
        state.setTouristMapRoute(route);
        navigation.setActiveTab("map");
      },
      onProfileEventClick: (event) => {
        state.setSelectedPerson(null);
        actions.handleEventClick(event);
      },
    },
  });

  return {
    viewModel,
    filteredData,
  };
}
