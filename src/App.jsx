import { useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useLocation, useNavigate } from "react-router-dom";
import AppContent from "./app/AppContent.jsx";
import { useAppDomainActions } from "./hooks/useAppDomainActions.js";
import { useAppLifecycleEffects } from "./hooks/useAppLifecycleEffects.js";
import { useAppNavigation } from "./hooks/useAppNavigation.js";
import { useAppScreenModel } from "./hooks/useAppScreenModel.js";
import { useAppStoreState } from "./hooks/useAppStoreState.js";
import { useGuestModeActions } from "./hooks/useGuestModeActions.js";
import { useMaxBackButton } from "./hooks/useMaxBackButton.js";
import { useStartParam } from "./hooks/useStartParam.js";
import { useStore } from "./store/StoreProvider.jsx";
import { isMobileOrTablet } from "./utils/device";
import { trackEvent } from "./lib/analytics.js";

function App() {
  const store = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const state = useAppStoreState(store);
  const userId = store.session.userId;
  const isMobile = useMemo(() => isMobileOrTablet(), []);
  const track = trackEvent;

  useMaxBackButton();
  useStartParam();

  const pushToast = useCallback(
    (text, variant = "success") => store.ui.pushToast(text, variant),
    [store],
  );
  const { enterGuestMode, exitGuestMode } = useGuestModeActions({
    store,
    pushToast,
  });
  const navigation = useAppNavigation({
    location,
    navigate,
    events: state.events,
    pushToast,
    setSelectedEvent: state.setSelectedEvent,
    setSelectedOrganizer: state.setSelectedOrganizer,
    setParticipantsEvent: state.setParticipantsEvent,
    setSelectedPerson: state.setSelectedPerson,
    setIsTouristPlanOpen: state.setIsTouristPlanOpen,
  });
  const session = useAppLifecycleEffects({
    store,
    location,
    navigate,
    userId,
    isMobile,
    state,
    navigation,
    pushToast,
    track,
  });
  const actions = useAppDomainActions({
    store,
    location,
    navigate,
    state,
    navigation,
    pushToast,
    loadBootstrap: session.loadBootstrap,
    refreshFriendsCount: session.refreshFriendsCount,
    track,
  });
  const { viewModel } = useAppScreenModel({
    location,
    navigate,
    store,
    state,
    navigation,
    actions,
    guestActions: { enterGuestMode, exitGuestMode },
    track,
  });

  return (
    <AppContent
      activeTab={navigation.activeTab}
      incomingFriendsCount={state.incomingFriendsCount}
      setActiveTab={navigation.setActiveTab}
      isGuestMode={state.isGuestMode}
      onEnterGuestMode={viewModel.onEnterGuestMode}
      onExitGuestMode={viewModel.onExitGuestMode}
      isExploreTab={viewModel.isExploreTab}
      headerProps={viewModel.headerProps}
      pageProps={viewModel.pageProps}
      selectedEvent={state.selectedEvent}
      onCreateFromNavigation={actions.handleCreateFromNavigation}
      onTrackCreate={viewModel.onTrackCreate}
      overlayProps={viewModel.overlayProps}
    />
  );
}

export default observer(App);
