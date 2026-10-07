import Icon from "../../components/Icon";
import TouristRouteMap from "./TouristRouteMap";
import TouristPlacePicker from "./TouristPlacePicker.jsx";
import TouristPlanTimeline from "./TouristPlanTimeline.jsx";
import { formatOptionsCount, formatPlanSummary } from "./planModel.js";

export default function TouristPlanResults({
  plan,
  selectedOption,
  saveStatus,
  offlinePinned,
  isCurrentPlan,
  routeStops,
  routeSchedule,
  draggedStopKey,
  onDraggedStopKeyChange,
  routeEditor,
  placeEditor,
  days,
  mapInitialCenter,
  mapLinks,
  onClose,
  onEventClick,
  onShowOnMap,
  onSaveOffline,
}) {
  return (
    <div className="tourist-plan-result" aria-live="polite">
      <div className="tourist-plan-result-heading">
        <p className="tourist-plan-summary">
          {plan.options.length === 1
            ? "Сохранённый маршрут"
            : formatOptionsCount(plan.options.length)}
        </p>
        <span
          className={`tourist-plan-save-state ${saveStatus === "synced" ? "is-saved" : ""}`}
        >
          {offlinePinned
            ? "Офлайн-копия на устройстве"
            : saveStatus === "saving"
              ? "Сохраняем…"
              : saveStatus === "synced"
                ? "Синхронизирован с MAX"
                : saveStatus === "device"
                  ? "Пока только на устройстве"
                  : saveStatus === "dirty"
                    ? "Синхронизация…"
                    : "Черновик"}
        </span>
      </div>
      <div
        className="tourist-plan-options"
        role="group"
        aria-label="Варианты маршрута"
      >
        {plan.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selectedOption?.id === option.id}
            className={selectedOption?.id === option.id ? "active" : ""}
            onClick={() => routeEditor.selectOption(option.id)}
          >
            {option.title || `Вариант ${index + 1}`}
            <small>{formatPlanSummary(option.events)}</small>
          </button>
        ))}
      </div>
      {selectedOption && (
        <>
          <p className="tourist-plan-summary">
            {formatPlanSummary(selectedOption.events)}
          </p>
          {selectedOption.removedOverlappingEventCount > 0 && (
            <p className="tourist-plan-overlap-warning" role="status">
              Из маршрута исключено событий с пересечением по времени:{" "}
              {selectedOption.removedOverlappingEventCount}. Обновите варианты,
              чтобы найти замену.
            </p>
          )}
          <p className="tourist-route-timing-note">
            Время остановок расчётное; время в пути между точками не
            учитывается.
          </p>
          <TouristPlanTimeline
            selectedOption={selectedOption}
            routeStops={routeStops}
            routeSchedule={routeSchedule}
            draggedStopKey={draggedStopKey}
            onDraggedStopKeyChange={onDraggedStopKeyChange}
            onReorderStop={routeEditor.reorderStop}
            days={days}
            onUpdatePlaceDuration={routeEditor.updatePlaceDuration}
            onUpdatePlaceStartTime={routeEditor.updatePlaceStartTime}
            onClose={onClose}
            onEventClick={onEventClick}
            onMoveStop={routeEditor.moveStop}
            onRemoveCustomStop={routeEditor.handleRemoveCustomStop}
            onTogglePlace={routeEditor.togglePlace}
            onRemoveEvent={routeEditor.handleRemoveEvent}
          />
          <TouristPlacePicker
            selectedOption={selectedOption}
            placesKind={placeEditor.placesKind}
            onPlacesKindChange={placeEditor.setPlacesKind}
            placesLoading={placeEditor.placesLoading}
            placesError={placeEditor.placesError}
            onFindPlaces={placeEditor.findPlaces}
            placeSearchQuery={placeEditor.placeSearchQuery}
            onPlaceSearchQueryChange={placeEditor.setPlaceSearchQuery}
            placeSearchLoading={placeEditor.placeSearchLoading}
            placeSearchError={placeEditor.placeSearchError}
            onSearchPlaces={placeEditor.searchPlacesByText}
            textPlaceSuggestions={placeEditor.textPlaceSuggestions}
            placeSuggestions={placeEditor.placeSuggestions}
            onAddCustomStop={routeEditor.addCustomStop}
            onTogglePlace={routeEditor.togglePlace}
            manualStopName={placeEditor.manualStopName}
            onManualStopNameChange={placeEditor.setManualStopName}
            manualAddress={placeEditor.manualAddress}
            onManualAddressChange={placeEditor.handleManualAddressChange}
            manualAddressResults={placeEditor.manualAddressResults}
            manualAddressLoading={placeEditor.manualAddressLoading}
            onSearchManualAddress={placeEditor.searchManualAddress}
            onSelectAddress={placeEditor.selectManualAddress}
            manualDuration={placeEditor.manualDuration}
            onManualDurationChange={placeEditor.setManualDuration}
            manualStartTime={placeEditor.manualStartTime}
            onManualStartTimeChange={placeEditor.setManualStartTime}
            manualMapOpen={placeEditor.manualMapOpen}
            onToggleManualMap={() =>
              placeEditor.setManualMapOpen((open) => !open)
            }
            routeStops={routeStops}
            mapInitialCenter={mapInitialCenter}
            manualPoint={placeEditor.manualPoint}
            onSelectManualPoint={placeEditor.selectManualPoint}
            manualStopError={placeEditor.manualStopError}
            onSubmitManualStop={placeEditor.submitManualStop}
          />
          {mapLinks && (
            <>
              <button
                type="button"
                className="tourist-show-on-map"
                onClick={() =>
                  onShowOnMap?.({
                    ...plan,
                    selectedOptionId: selectedOption.id,
                  })
                }
              >
                <Icon name="map" size={18} />
                Показать на карте
              </button>
              <TouristRouteMap stops={routeStops} />
              <div className="tourist-map-exports">
                <a href={mapLinks.yandex} target="_blank" rel="noreferrer">
                  Яндекс Карты
                </a>
                <a href={mapLinks.twoGis} target="_blank" rel="noreferrer">
                  2ГИС
                </a>
              </div>
            </>
          )}
          {selectedOption.events.length === 0 ? (
            <p className="tourist-plan-stale">
              В этом варианте пока нет событий. Обновите варианты.
            </p>
          ) : (
            <button
              type="button"
              className="tourist-plan-save"
              disabled={!isCurrentPlan || offlinePinned}
              onClick={onSaveOffline}
            >
              <Icon name={offlinePinned ? "calendar" : "plus"} size={18} />
              {offlinePinned
                ? "Офлайн-копия сохранена"
                : "Сохранить офлайн-копию"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
