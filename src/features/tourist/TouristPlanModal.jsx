import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import { useStore } from "../../store/StoreProvider";
import { findCityByName } from "../../utils/citySearch";
import { buildTouristMapLinks } from "../../utils/touristMapLinks";
import { getTouristRouteSchedule } from "../../utils/touristRouteSchedule";
import TouristPlanForm from "./TouristPlanForm.jsx";
import TouristPlanResults from "./TouristPlanResults.jsx";
import styles from "./TouristPlanModal.module.css";
import { useTouristPlaceEditor } from "./useTouristPlaceEditor.js";
import { useTouristPlanPersistence } from "./useTouristPlanPersistence.js";
import { useTouristPlanForm } from "./useTouristPlanForm.js";
import { useTouristPlanGeneration } from "./useTouristPlanGeneration.js";
import { useTouristRouteEditor } from "./useTouristRouteEditor.js";
import { createTouristPlan } from "./planModel.js";

const TouristPlanModal = ({
  initialCity,
  initialPlan,
  isGuestMode = false,
  userCoords,
  onClose,
  onEventClick,
  onShowOnMap,
}) => {
  const store = useStore();
  const [plan, setPlan] = useState(() => createTouristPlan(initialPlan));
  const [isReplanning, setIsReplanning] = useState(
    !initialPlan?.options?.length && !initialPlan?.events?.length,
  );
  const [saveStatus, setSaveStatus] = useState(
    initialPlan?.storage === "server"
      ? "synced"
      : initialPlan?.savedAt
        ? "device"
        : "draft",
  );
  const [offlinePinned, setOfflinePinned] = useState(
    Boolean(initialPlan?.offlinePinned),
  );
  const [planDirty, setPlanDirty] = useState(() =>
    Boolean(
      createTouristPlan(initialPlan)?.options.some(
        (option) => option.removedOverlappingEventCount,
      ),
    ),
  );
  const [error, setError] = useState("");
  const [draggedStopKey, setDraggedStopKey] = useState(null);

  const form = useTouristPlanForm({
    initialCity,
    initialPlan,
    userCoords,
    plan,
    setPlan,
    setPlanDirty,
    setSaveStatus,
    setOfflinePinned,
  });

  const selectedOption =
    plan?.options?.find((option) => option.id === plan.selectedOptionId) ||
    plan?.options?.[0];

  const { markPlanDirty } = useTouristPlanPersistence({
    plan,
    planDirty,
    isCurrentPlan: form.isCurrentPlan,
    offlinePinned,
    isGuestMode,
    store,
    setPlan,
    setPlanDirty,
    setSaveStatus,
    setError,
  });

  const generation = useTouristPlanGeneration({
    form,
    userCoords,
    isGuestMode,
    offlinePinned,
    store,
    setPlan,
    setIsReplanning,
    markPlanDirty,
    setError,
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !generation.loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [generation.loading, onClose]);

  const handleSaveOffline = () => {
    if (!plan || !form.isCurrentPlan || !selectedOption?.events.length) return;
    const saved = store.tourist.pinOffline(plan);
    if (!saved) {
      setError(
        "Не удалось сохранить маршрут на этом устройстве. Проверьте свободное место.",
      );
      return;
    }
    setOfflinePinned(true);
    setPlan(saved);
    setSaveStatus(saved.storage === "server" ? "synced" : "device");
    setError("");
  };

  const {
    routeStops,
    handleRemoveEvent,
    handleRemoveCustomStop,
    toggleInterest,
    selectOption,
    togglePlace,
    reorderStop,
    moveStop,
    addCustomStop,
    updatePlaceDuration,
    updatePlaceStartTime,
  } = useTouristRouteEditor({
    selectedOption,
    setPlan,
    setInterests: form.setInterests,
    markPlanDirty,
  });
  const routeSchedule = getTouristRouteSchedule(routeStops, {
    defaultDate: plan?.date,
  });
  const mapCity = findCityByName(plan?.city || form.city);
  const mapInitialCenter = mapCity
    ? [mapCity.lat, mapCity.lng]
    : [55.796, 49.108];
  const mapLinks = buildTouristMapLinks(routeStops, {
    userCoords: form.hasUserCoords ? userCoords : null,
    mode: "auto",
  });

  const placeEditor = useTouristPlaceEditor({
    selectedOption,
    addCustomStop,
  });

  return (
    <div
      className={`modal-overlay tourist-plan-overlay ${styles.scope}`}
      onClick={onClose}
    >
      <section
        className="modal-content tourist-plan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tourist-plan-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tourist-plan-heading">
          <div>
            <span className="tourist-plan-eyebrow">План поездки</span>
            <h2 id="tourist-plan-title">Туристический маршрут</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={22} />
          </button>
        </div>

        {plan && !isReplanning && (
          <button
            className="tourist-plan-replan"
            type="button"
            onClick={() => setIsReplanning(true)}
          >
            <Icon name="compass" size={18} />
            Составить маршрут заново
          </button>
        )}

        {(!plan || isReplanning) && (
          <TouristPlanForm
            city={form.city}
            onCityChange={form.setCity}
            date={form.date}
            onDateChange={form.setDate}
            days={form.days}
            onDaysChange={form.setDays}
            interests={form.interests}
            onToggleInterest={toggleInterest}
            budget={form.budget}
            onBudgetChange={form.setBudget}
            maxDistanceKm={form.maxDistanceKm}
            onMaxDistanceChange={form.setMaxDistanceKm}
            query={form.query}
            onQueryChange={form.setQuery}
            hasUserCoords={form.hasUserCoords}
            userCoords={userCoords}
            loading={generation.loading}
            isGuestMode={isGuestMode}
            hasPlan={Boolean(plan)}
            onSubmit={generation.handleSubmit}
            onTouch={form.markFormTouched}
          />
        )}

        {error && (
          <p className="tourist-plan-error" role="alert">
            {error}
          </p>
        )}

        {plan && !form.isCurrentPlan && (
          <p className="tourist-plan-stale" role="status">
            Параметры изменены. Составьте маршрут заново, чтобы применить их.
          </p>
        )}

        {plan && (
          <TouristPlanResults
            plan={plan}
            selectedOption={selectedOption}
            saveStatus={saveStatus}
            offlinePinned={offlinePinned}
            isCurrentPlan={form.isCurrentPlan}
            routeStops={routeStops}
            routeSchedule={routeSchedule}
            draggedStopKey={draggedStopKey}
            onDraggedStopKeyChange={setDraggedStopKey}
            routeEditor={{
              selectOption,
              reorderStop,
              updatePlaceDuration,
              updatePlaceStartTime,
              moveStop,
              handleRemoveCustomStop,
              togglePlace,
              handleRemoveEvent,
              addCustomStop,
            }}
            placeEditor={placeEditor}
            days={form.days}
            mapInitialCenter={mapInitialCenter}
            mapLinks={mapLinks}
            onClose={onClose}
            onEventClick={onEventClick}
            onShowOnMap={onShowOnMap}
            onSaveOffline={handleSaveOffline}
          />
        )}
      </section>
    </div>
  );
};

export default TouristPlanModal;
