import { useCallback } from "react";
import { useAppPageActions } from "./useAppPageActions.js";
import { useEntityNavigation } from "./useEntityNavigation.js";
import { useEventActions } from "./useEventActions.js";
import { useEventConfirmationActions } from "./useEventConfirmationActions.js";
import { useProfileActions } from "./useProfileActions.js";

export function useAppDomainActions({
  store,
  location,
  navigate,
  state,
  navigation,
  pushToast,
  loadBootstrap,
  refreshFriendsCount,
  track,
}) {
  const {
    handleSaveProfile,
    handleCitySelect,
    handleToggleTheme,
    handleToggleNotifications,
  } = useProfileActions({
    store,
    userId: store.session.userId,
    isGuestMode: state.isGuestMode,
    user: state.user,
    profile: state.profile,
    setProfile: state.setProfile,
    setSelectedCity: state.setSelectedCity,
    setSelectedEvent: state.setSelectedEvent,
    setQuickFilter: state.setQuickFilter,
    setFilters: state.setFilters,
    setIsCityOpen: state.setIsCityOpen,
    setTheme: state.setTheme,
    setNotificationsOn: state.setNotificationsOn,
    pushToast,
  });

  const {
    handleJoinEvent,
    handleLeaveEvent,
    handleToggleLike,
    handleCreateEvent,
    handleAddReview,
  } = useEventActions({
    store,
    isGuestMode: state.isGuestMode,
    userId: store.session.userId,
    user: state.user,
    profile: state.profile,
    selectedCity: state.selectedCity,
    joinedIds: state.joinedIds,
    pendingActions: state.pendingActions,
    setSelectedEvent: state.setSelectedEvent,
    setLikedIds: state.setLikedIds,
    setEditingEvent: state.setEditingEvent,
    setActiveTab: navigation.setActiveTab,
    pushToast,
    loadBootstrap,
    track,
  });

  const { requestDelete, confirmDelete, requestLeave, confirmLeave } =
    useEventConfirmationActions({
      store,
      userId: store.session.userId,
      joinedIds: state.joinedIds,
      routeEventId: navigation.routeEventId,
      closeEvent: navigation.closeEvent,
      pushToast,
      loadBootstrap,
      handleLeaveEvent,
      pendingDelete: state.pendingDelete,
      deleting: state.deleting,
      pendingLeave: state.pendingLeave,
      setSelectedEvent: state.setSelectedEvent,
      setPendingDelete: state.setPendingDelete,
      setDeleting: state.setDeleting,
      setDeleteError: state.setDeleteError,
      setPendingLeave: state.setPendingLeave,
    });

  const handleFriendsChanged = useCallback(() => {
    refreshFriendsCount();
  }, [refreshFriendsCount]);

  const {
    handleEventClick,
    handleOpenFriendProfile,
    handleOpenOrganizer,
    handleOpenParticipants,
    handleOpenParticipantProfile,
  } = useEntityNavigation({
    location,
    navigate,
    store,
    track,
    routeOrganizerIdRef: navigation.routeOrganizerIdRef,
    routeUserIdRef: navigation.routeUserIdRef,
    setSelectedEvent: state.setSelectedEvent,
    setSelectedOrganizer: state.setSelectedOrganizer,
    setParticipantsEvent: state.setParticipantsEvent,
    setParticipantProfiles: state.setParticipantProfiles,
    setSelectedPerson: state.setSelectedPerson,
  });

  const {
    handleEditEvent,
    handleApplyFilters,
    handleOpenChat,
    handleCreateFromEmptyState,
    handleCancelCreate,
    handleCreateFromNavigation,
  } = useAppPageActions({
    location,
    navigate,
    userId: store.session.userId,
    routeEditEventId: navigation.routeEditEventId,
    setEditingEvent: state.setEditingEvent,
    setSelectedEvent: state.setSelectedEvent,
    setActiveTab: navigation.setActiveTab,
    setFilters: state.setFilters,
    setQuickFilter: state.setQuickFilter,
    pushToast,
    track,
  });

  return {
    handleSaveProfile,
    handleCitySelect,
    handleToggleTheme,
    handleToggleNotifications,
    handleJoinEvent,
    handleLeaveEvent,
    handleToggleLike,
    handleCreateEvent,
    handleAddReview,
    requestDelete,
    confirmDelete,
    requestLeave,
    confirmLeave,
    handleFriendsChanged,
    handleEventClick,
    handleOpenFriendProfile,
    handleOpenOrganizer,
    handleOpenParticipants,
    handleOpenParticipantProfile,
    handleEditEvent,
    handleApplyFilters,
    handleOpenChat,
    handleCreateFromEmptyState,
    handleCancelCreate,
    handleCreateFromNavigation,
  };
}
