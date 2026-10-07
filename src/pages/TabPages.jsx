import { lazy, Suspense } from "react";
import EventFeed from "../features/events/EventFeed.jsx";
import { EventSkeletonList } from "../features/events/EventSkeleton.jsx";

const FriendsPage = lazy(() => import("../features/friends/FriendsPage.jsx"));
const EventMap = lazy(() => import("../features/map/EventMap.jsx"));
const CreateEventForm = lazy(() => import("../features/events/CreateEventForm.jsx"));
const MyEvents = lazy(() => import("../features/events/MyEvents.jsx"));
const Profile = lazy(() => import("../features/profile/Profile.jsx"));

export default function TabPages({
  activeTab,
  loading,
  isReady,
  userId,
  events,
  filteredEvents,
  mapEvents,
  mapTimeFilter,
  onMapTimeFilterChange,
  touristMapRoute,
  onCloseTouristRoute,
  onDelete,
  onJoin,
  onLeave,
  onLeaveRequest,
  onEventClick,
  joinedIds,
  participatedIds,
  likedIds,
  onToggleLike,
  pendingActions,
  activeFiltersCount,
  onResetFilters,
  onCreateFromEmptyState,
  onCreate,
  onEdit,
  onCancelCreate,
  userName,
  userPhotoUrl,
  userAge,
  userCity,
  userAbout,
  city,
  cityCoords,
  userCoords,
  editingEvent,
  showCreatedInitially,
  user,
  profile,
  onSaveProfile,
  createdCount,
  friendsCount,
  incomingRequestsCount,
  onOpenFriends,
  notificationsOn,
  onToggleNotifications,
  theme,
  onToggleTheme,
  onOpenFriendProfile,
}) {
  if (loading || !isReady) return <EventSkeletonList count={3} />;

  return (
    <>
      {activeTab === "feed" && (
        <EventFeed
          userId={userId}
          onDelete={onDelete}
          events={filteredEvents}
          onJoin={onJoin}
          onLeave={onLeave}
          onLeaveRequest={onLeaveRequest}
          onEventClick={onEventClick}
          joinedIds={joinedIds}
          likedIds={likedIds}
          onToggleLike={onToggleLike}
          pendingActions={pendingActions}
          activeFiltersCount={activeFiltersCount}
          onResetFilters={onResetFilters}
          onCreate={onCreateFromEmptyState}
        />
      )}

      {activeTab === "friends" && (
        <Suspense fallback={<EventSkeletonList count={2} />}>
          <FriendsPage
            onOpenProfile={onOpenFriendProfile}
          />
        </Suspense>
      )}

      {activeTab === "map" && (
        <Suspense fallback={<EventSkeletonList count={3} />}>
          <EventMap
            userId={userId}
            onDelete={onDelete}
            events={mapEvents}
            timeFilter={mapTimeFilter}
            onTimeFilterChange={onMapTimeFilterChange}
            touristRoute={touristMapRoute}
            onCloseTouristRoute={onCloseTouristRoute}
            onJoin={onJoin}
            onLeave={onLeave}
            onLeaveRequest={onLeaveRequest}
            onEventClick={onEventClick}
            joinedIds={joinedIds}
            likedIds={likedIds}
            onToggleLike={onToggleLike}
            city={city}
            cityCoords={cityCoords}
            userCoords={userCoords}
            showUserMarker={Boolean(userCoords)}
          />
        </Suspense>
      )}

      {activeTab === "create" && (
        <Suspense fallback={<EventSkeletonList count={2} />}>
          <CreateEventForm
            onCreate={onCreate}
            onCancel={onCancelCreate}
            userId={userId || ""}
            userName={userName}
            userPhotoUrl={userPhotoUrl}
            userAge={userAge}
            userCity={userCity}
            userAbout={userAbout}
            city={city}
            cityCoords={cityCoords}
            initialEvent={editingEvent}
          />
        </Suspense>
      )}

      {activeTab === "my" && (
        <Suspense fallback={<EventSkeletonList count={2} />}>
          <MyEvents
            onDelete={onDelete}
            onEdit={onEdit}
            events={events}
            onJoin={onJoin}
            onLeave={onLeave}
            onLeaveRequest={onLeaveRequest}
            onEventClick={onEventClick}
            joinedIds={joinedIds}
            participatedIds={participatedIds}
            likedIds={likedIds}
            onToggleLike={onToggleLike}
            userId={userId || ""}
            showCreatedInitially={showCreatedInitially}
          />
        </Suspense>
      )}

      {activeTab === "profile" && (
        <Suspense fallback={<EventSkeletonList count={2} />}>
          <Profile
            user={user}
            profile={profile}
            onSaveProfile={onSaveProfile}
            joinedIds={joinedIds}
            participatedIds={participatedIds}
            createdCount={createdCount}
            friendsCount={friendsCount}
            incomingRequestsCount={incomingRequestsCount}
            onOpenFriends={onOpenFriends}
            notificationsOn={notificationsOn}
            onToggleNotifications={onToggleNotifications}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        </Suspense>
      )}
    </>
  );
}
