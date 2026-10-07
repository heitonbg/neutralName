import DesktopSidebar from "./DesktopSidebar.jsx";
import AppExploreHeader from "./AppExploreHeader.jsx";
import TabPages from "../pages/TabPages.jsx";
import AppOverlays from "./AppOverlays.jsx";
import AppBottomNavigation from "./AppBottomNavigation.jsx";
import AppGuestModeBanner from "./AppGuestModeBanner.jsx";
import shellStyles from "./AppShell.module.css";
import responsiveStyles from "./AppResponsive.module.css";

export default function AppContent({
  activeTab,
  incomingFriendsCount,
  setActiveTab,
  isGuestMode,
  onEnterGuestMode,
  onExitGuestMode,
  isExploreTab,
  headerProps,
  pageProps,
  selectedEvent,
  onCreateFromNavigation,
  onTrackCreate,
  overlayProps,
}) {
  return (
    <div
      className={`app-container ${shellStyles.scope} ${responsiveStyles.scope}`}
    >
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        incomingFriendsCount={incomingFriendsCount}
      />

      <div className="main-content">
        <AppGuestModeBanner
          isGuestMode={isGuestMode}
          onEnter={onEnterGuestMode}
          onExit={onExitGuestMode}
        />
        {isExploreTab && <AppExploreHeader {...headerProps} />}

        <div className="content-area">
          <TabPages {...pageProps} />
        </div>

        {!selectedEvent && (
          <AppBottomNavigation
            activeTab={activeTab}
            incomingFriendsCount={incomingFriendsCount}
            onNavigate={setActiveTab}
            onCreate={onCreateFromNavigation}
            onTrackCreate={onTrackCreate}
          />
        )}
      </div>

      <AppOverlays {...overlayProps} />
    </div>
  );
}
