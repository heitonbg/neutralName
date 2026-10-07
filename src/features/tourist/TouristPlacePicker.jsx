import Icon from "../../components/Icon";
import TouristRouteMap from "./TouristRouteMap";

const PLACE_KINDS = [
  { id: "restaurants", label: "Поесть" },
  { id: "attractions", label: "Достопримечательности" },
  { id: "both", label: "Любые идеи" },
];

const DURATIONS = [30, 45, 60, 90, 120];

export default function TouristPlacePicker({
  selectedOption,
  placesKind,
  onPlacesKindChange,
  placesLoading,
  placesError,
  onFindPlaces,
  placeSearchQuery,
  onPlaceSearchQueryChange,
  placeSearchLoading,
  placeSearchError,
  onSearchPlaces,
  textPlaceSuggestions,
  placeSuggestions,
  onAddCustomStop,
  onTogglePlace,
  manualStopName,
  onManualStopNameChange,
  manualAddress,
  onManualAddressChange,
  manualAddressResults,
  manualAddressLoading,
  onSearchManualAddress,
  onSelectAddress,
  manualDuration,
  onManualDurationChange,
  manualStartTime,
  onManualStartTimeChange,
  manualMapOpen,
  onToggleManualMap,
  routeStops,
  mapInitialCenter,
  manualPoint,
  onSelectManualPoint,
  manualStopError,
  onSubmitManualStop,
}) {
  return (
    <section className="tourist-place-picker">
      <div className="tourist-place-picker-heading">
        <div>
          <h3>Добавить остановки</h3>
          <p>Кафе, рестораны и достопримечательности рядом с событиями</p>
        </div>
        <Icon name="pin" size={20} />
      </div>
      <div className="tourist-place-actions">
        <div className="tourist-place-kind" role="group" aria-label="Тип мест">
          {PLACE_KINDS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={placesKind === id ? "active" : ""}
              aria-pressed={placesKind === id}
              onClick={() => onPlacesKindChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="tourist-place-search"
          disabled={
            placesLoading ||
            !selectedOption.events.some(
              (event) => event.lat != null && event.lng != null,
            )
          }
          onClick={onFindPlaces}
        >
          {placesLoading ? "Подбираем…" : "Подобрать с ИИ"}
        </button>
      </div>
      <p className="tourist-place-attribution">
        ИИ выбирает из реально найденных мест OpenStreetMap. Проверяй часы
        работы перед визитом.
      </p>
      {placesError && (
        <p className="tourist-plan-stale" role="status">
          {placesError}
        </p>
      )}
      <form className="tourist-place-text-search" onSubmit={onSearchPlaces}>
        <label htmlFor="tourist-place-query">
          Искать конкретное место или улицу
        </label>
        <div>
          <input
            id="tourist-place-query"
            value={placeSearchQuery}
            onChange={(event) => onPlaceSearchQueryChange(event.target.value)}
            placeholder="Например, набережная, отель, кофейня"
          />
          <button
            type="submit"
            disabled={placeSearchLoading || !placeSearchQuery.trim()}
          >
            {placeSearchLoading ? "Поиск…" : "Найти"}
          </button>
        </div>
      </form>
      {placeSearchError && (
        <p className="tourist-plan-stale" role="status">
          {placeSearchError}
        </p>
      )}
      {textPlaceSuggestions.length > 0 && (
        <ul className="tourist-place-results">
          {textPlaceSuggestions.map((place) => {
            const isAdded = (selectedOption.customStops || []).some(
              (item) => item.id === place.id,
            );
            return (
              <li key={place.id}>
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.kindLabel} · OpenStreetMap</small>
                  <small>{place.address}</small>
                </span>
                <button
                  type="button"
                  className={isAdded ? "active" : ""}
                  aria-pressed={isAdded}
                  onClick={() => onAddCustomStop(place)}
                  disabled={isAdded}
                >
                  {isAdded ? "Добавлено" : "Добавить"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {placeSuggestions.length > 0 && (
        <ul className="tourist-place-results">
          {placeSuggestions.map((place) => {
            const isAdded = (selectedOption.places || []).some(
              (item) => item.id === place.id,
            );
            return (
              <li key={place.id}>
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {place.kindLabel} · {place.distanceKm} км
                  </small>
                  {place.recommendationReason && (
                    <small>{place.recommendationReason}</small>
                  )}
                </span>
                <button
                  type="button"
                  className={isAdded ? "active" : ""}
                  aria-pressed={isAdded}
                  onClick={() => onTogglePlace(place)}
                >
                  {isAdded ? "Добавлено" : "Добавить"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <form className="tourist-manual-stop-form" onSubmit={onSubmitManualStop}>
        <h4>Своя остановка</h4>
        <label>
          Название
          <input
            required
            maxLength={120}
            value={manualStopName}
            onChange={(event) => onManualStopNameChange(event.target.value)}
            placeholder="Например, встреча с друзьями"
          />
        </label>
        <label>
          Адрес
          <span className="tourist-manual-address-row">
            <input
              maxLength={180}
              value={manualAddress}
              onChange={(event) => onManualAddressChange(event.target.value)}
              placeholder="Улица, дом или место"
            />
            <button
              type="button"
              disabled={manualAddressLoading || manualAddress.trim().length < 3}
              onClick={onSearchManualAddress}
            >
              {manualAddressLoading ? "Ищем…" : "Найти"}
            </button>
          </span>
        </label>
        {manualAddressResults.length > 0 && (
          <ul className="tourist-manual-address-results">
            {manualAddressResults.map((address, index) => (
              <li key={`${address.lat}:${address.lng}:${index}`}>
                <button
                  type="button"
                  onClick={() => onSelectAddress(address)}
                >
                  {address.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="tourist-manual-stop-actions">
          <button
            type="button"
            className="tourist-manual-map-toggle"
            onClick={onToggleManualMap}
          >
            <Icon name="pin" size={16} />
            {manualMapOpen ? "Скрыть карту" : "Выбрать точку на карте"}
          </button>
          <label className="tourist-place-duration">
            Длительность
            <select
              aria-label="Плановая длительность ручной остановки"
              value={manualDuration}
              onChange={(event) =>
                onManualDurationChange(Number(event.target.value))
              }
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} мин
                </option>
              ))}
            </select>
          </label>
          <label className="tourist-place-start-time">
            Начало
            <input
              type="time"
              aria-label="Время начала своей остановки"
              value={manualStartTime}
              onChange={(event) =>
                onManualStartTimeChange(event.target.value)
              }
            />
          </label>
        </div>
        {manualMapOpen && (
          <>
            <p className="tourist-plan-privacy">
              Нажми на карту, чтобы поставить точку остановки.
            </p>
            <TouristRouteMap
              stops={routeStops}
              interactive
              initialCenter={mapInitialCenter}
              selectedPoint={manualPoint}
              onPointSelect={onSelectManualPoint}
            />
          </>
        )}
        {manualPoint && (
          <p className="tourist-manual-point-status" role="status">
            Точка выбрана
          </p>
        )}
        {manualStopError && (
          <p className="tourist-plan-stale" role="alert">
            {manualStopError}
          </p>
        )}
        <button
          type="submit"
          className="tourist-manual-stop-submit"
          disabled={!manualStopName.trim() || !manualPoint}
        >
          <Icon name="plus" size={17} />
          Добавить остановку
        </button>
      </form>
    </section>
  );
}
