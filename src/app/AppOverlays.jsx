import { lazy, Suspense } from "react";
import FiltersModal from "../features/events/FiltersModal.jsx";
import DeleteEventDialog from "../features/events/DeleteEventDialog.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import styles from "./AppOverlays.module.css";

const EventDetailModal = lazy(() => import("../features/events/EventDetailModal.jsx"));
const OrganizerProfileModal = lazy(() => import("../features/profile/OrganizerProfileModal.jsx"));
const ParticipantsModal = lazy(() => import("../features/events/ParticipantsModal.jsx"));
const UserProfileModal = lazy(() => import("../features/profile/UserProfileModal.jsx"));
const CityPickerModal = lazy(() => import("../features/city/CityPickerModal.jsx"));
const TouristPlanModal = lazy(() => import("../features/tourist/TouristPlanModal.jsx"));

export default function AppOverlays({
  filtersOpen,
  onCloseFilters,
  onApplyFilters,
  filters,
  sortBy,
  onSortChange,
  touristPlanOpen,
  touristPlanKey,
  isGuestMode,
  selectedCity,
  savedTouristPlan,
  userId,
  userCoords,
  onCloseTouristPlan,
  onEventClick,
  onShowTouristRouteOnMap,
  selectedEvent,
  onDeleteEvent,
  onEditEvent,
  onCloseEvent,
  onJoinEvent,
  onLeaveEvent,
  onLeaveRequest,
  onOpenChat,
  onOpenOrganizer,
  onOpenParticipants,
  joined,
  liked,
  onToggleLike,
  userName,
  reviews,
  onAddReview,
  wasParticipant,
  relatedEvents,
  onShareEvent,
  selectedOrganizer,
  organizerEvents,
  onCloseOrganizer,
  onFriendsChanged,
  participantsEvent,
  participantProfiles,
  loadingParticipants,
  onCloseParticipants,
  onOpenParticipantProfile,
  selectedPerson,
  profileEvents,
  profileReviews,
  onCloseUserProfile,
  onProfileEventClick,
  pendingDelete,
  deleting,
  deleteError,
  onCancelDelete,
  onConfirmDelete,
  pendingLeave,
  leaveBusy,
  onCancelLeave,
  onConfirmLeave,
  toasts,
  onDismissToast,
  cityPickerOpen,
  onSelectCity,
  onCloseCityPicker,
}) {
  return (
    <>
      {filtersOpen && (
        <FiltersModal
          onClose={onCloseFilters}
          onApply={onApplyFilters}
          initialFilters={filters}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      )}

      {touristPlanOpen && (
        <Suspense fallback={null}>
          <TouristPlanModal
            key={touristPlanKey}
            initialCity={selectedCity?.name || ""}
            initialPlan={savedTouristPlan}
            isGuestMode={isGuestMode}
            userCoords={userCoords}
            onClose={onCloseTouristPlan}
            onEventClick={onEventClick}
            onShowOnMap={onShowTouristRouteOnMap}
          />
        </Suspense>
      )}

      {selectedEvent && (
        <Suspense fallback={null}>
          <EventDetailModal
            onDelete={onDeleteEvent}
            onEdit={onEditEvent}
            event={selectedEvent}
            onClose={onCloseEvent}
            onJoin={onJoinEvent}
            onLeave={onLeaveEvent}
            onLeaveRequest={onLeaveRequest}
            onOpenChat={onOpenChat}
            onOpenOrganizer={onOpenOrganizer}
            onOpenParticipants={onOpenParticipants}
            isJoined={joined}
            isLiked={liked}
            onToggleLike={onToggleLike}
            userId={userId || ""}
            userName={userName}
            reviews={reviews}
            onAddReview={onAddReview}
            wasParticipant={wasParticipant}
            relatedEvents={relatedEvents}
            onRelatedClick={onEventClick}
            onShare={onShareEvent}
          />
        </Suspense>
      )}

      {selectedOrganizer && (
        <Suspense fallback={null}>
          <OrganizerProfileModal
            organizer={selectedOrganizer}
            events={organizerEvents}
            onClose={onCloseOrganizer}
            onEventClick={onEventClick}
            currentUserId={userId}
            onFriendsChanged={onFriendsChanged}
          />
        </Suspense>
      )}

      {participantsEvent && (
        <Suspense fallback={null}>
          <ParticipantsModal
            event={participantsEvent}
            participants={participantProfiles}
            loading={loadingParticipants}
            onClose={onCloseParticipants}
            onOpenProfile={onOpenParticipantProfile}
          />
        </Suspense>
      )}

      {selectedPerson && (
        <Suspense fallback={null}>
          <UserProfileModal
            person={selectedPerson}
            events={profileEvents}
            reviews={profileReviews}
            currentUserId={userId}
            onClose={onCloseUserProfile}
            onEventClick={onProfileEventClick}
            onFriendsChanged={onFriendsChanged}
          />
        </Suspense>
      )}

      {pendingDelete && (
        <DeleteEventDialog
          event={pendingDelete}
          busy={deleting}
          error={deleteError}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      )}

      {pendingLeave && (
        <ConfirmDialog
          title="Отказаться от участия?"
          description={`Вы отмените участие в «${pendingLeave.title}». Место освободится для других.`}
          confirmLabel="Отказаться"
          cancelLabel="Остаться"
          destructive
          busy={leaveBusy}
          onCancel={onCancelLeave}
          onConfirm={onConfirmLeave}
        />
      )}

      <div className={styles.toastStack} aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            className={`${styles.toast} ${styles[toast.variant] || ""}`}
            onClick={() => onDismissToast(toast.id)}
          >
            <span className={styles.toastIcon}>
              {toast.variant === "error"
                ? "⚠"
                : toast.variant === "info"
                  ? "ℹ"
                  : "✓"}
            </span>{" "}
            {toast.text}
          </button>
        ))}
      </div>

      {cityPickerOpen && (
        <Suspense fallback={null}>
          <CityPickerModal
            isOpen={cityPickerOpen}
            currentCity={selectedCity}
            onSelect={onSelectCity}
            onClose={onCloseCityPicker}
          />
        </Suspense>
      )}
    </>
  );
}
