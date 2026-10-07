import Icon from "../../components/Icon";
import { getTouristStopKey, isTouristPlace } from "../../utils/touristMapLinks";
import { formatDay, formatTimeInput } from "./planModel.js";

const DURATIONS = [30, 45, 60, 90, 120];

const formatWindowTime = (date) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

export default function TouristPlanTimeline({
  selectedOption,
  routeStops,
  routeSchedule,
  draggedStopKey,
  onDraggedStopKeyChange,
  onReorderStop,
  days,
  onUpdatePlaceDuration,
  onUpdatePlaceStartTime,
  onClose,
  onEventClick,
  onMoveStop,
  onRemoveCustomStop,
  onTogglePlace,
  onRemoveEvent,
}) {
  return (
    <ol className="tourist-plan-timeline">
      {routeStops.map((stop, index) => {
        const isPlace = isTouristPlace(stop);
        const stopKey = getTouristStopKey(stop);
        const schedule = routeSchedule[index];
        const hasConflict = schedule.overlapsPrevious || schedule.overlapsNext;

        return (
          <li
            key={stopKey}
            className={`tourist-plan-stop ${isPlace ? "tourist-plan-place-stop" : ""} ${draggedStopKey === stopKey ? "is-dragging" : ""}`}
            draggable={isPlace && routeStops.length > 1}
            onDragStart={(event) => {
              if (!isPlace) return;
              onDraggedStopKeyChange(stopKey);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", stopKey);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              onReorderStop(
                event.dataTransfer.getData("text/plain") || draggedStopKey,
                stopKey,
              );
              onDraggedStopKeyChange(null);
            }}
            onDragEnd={() => onDraggedStopKeyChange(null)}
          >
            <span
              className={`tourist-plan-time-window ${hasConflict ? "has-conflict" : ""}`}
            >
              <strong>
                {formatWindowTime(schedule.start)} -{" "}
                {formatWindowTime(schedule.end)}
              </strong>
              <small>
                {isPlace
                  ? `Остановка · ${schedule.durationMinutes} мин`
                  : Number(days) > 1
                    ? formatDay(stop)
                    : "Событие"}
              </small>
              {hasConflict && (
                <small className="tourist-plan-time-conflict">
                  Накладка по времени
                </small>
              )}
            </span>
            {isPlace ? (
              <div className="tourist-plan-place-description">
                <small>
                  {stop.kindLabel} ·{" "}
                  {stop.source === "manual" ? "Вручную" : "OpenStreetMap"}
                </small>
                <strong>{stop.name}</strong>
                <span>
                  {stop.address ||
                    `Рядом: ${selectedOption.events.find((event) => String(event.id) === String(stop.eventId))?.title || "событие"}`}
                </span>
                <label className="tourist-place-duration">
                  Длительность
                  <select
                    value={schedule.durationMinutes}
                    aria-label={`Длительность остановки «${stop.name}»`}
                    onChange={(event) =>
                      onUpdatePlaceDuration(stop.id, event.target.value)
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
                    aria-label={`Время начала остановки «${stop.name}»`}
                    value={stop.startTime || formatTimeInput(schedule.start)}
                    onChange={(event) =>
                      onUpdatePlaceStartTime(stop.id, event.target.value)
                    }
                  />
                </label>
              </div>
            ) : (
              <button
                type="button"
                className="tourist-plan-event"
                onClick={() => {
                  onClose();
                  onEventClick(stop);
                }}
              >
                <span className="tourist-plan-event-category">
                  {stop.category}
                </span>
                <strong>{stop.title}</strong>
                <span>{stop.address || stop.district || "Адрес уточняется"}</span>
                <span className="tourist-plan-event-meta">
                  {stop.price || "Стоимость уточняется"}
                  {stop.maxParticipants
                    ? ` · ${stop.participants}/${stop.maxParticipants} мест`
                    : ""}
                </span>
              </button>
            )}
            <div className="tourist-plan-stop-controls">
              {isPlace && (
                <span
                  className="tourist-plan-drag-handle"
                  title="Перетащить остановку"
                  aria-hidden="true"
                >
                  <Icon name="move" size={16} />
                </span>
              )}
              {isPlace && (
                <button
                  type="button"
                  className="tourist-plan-move"
                  aria-label={`Переместить ${stop.name} выше`}
                  title="Переместить выше"
                  disabled={index === 0}
                  onClick={() => onMoveStop(index, -1)}
                >
                  <Icon name="chevronUp" size={16} />
                </button>
              )}
              {isPlace && (
                <button
                  type="button"
                  className="tourist-plan-move"
                  aria-label={`Переместить ${stop.name} ниже`}
                  title="Переместить ниже"
                  disabled={index === routeStops.length - 1}
                  onClick={() => onMoveStop(index, 1)}
                >
                  <Icon name="chevronDown" size={16} />
                </button>
              )}
              <button
                type="button"
                className="tourist-plan-remove"
                aria-label={`Убрать «${isPlace ? stop.name : stop.title}» из маршрута`}
                title="Убрать из маршрута"
                onClick={() =>
                  stop.kind === "custom"
                    ? onRemoveCustomStop(stop.id)
                    : isPlace
                      ? onTogglePlace(stop)
                      : onRemoveEvent(stop.id)
                }
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
