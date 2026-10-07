import Icon from "../../components/Icon";
import styles from "./EventMap.module.css";

const TIME_FILTERS = [
  { id: "all", label: "Все даты" },
  { id: "now", label: "Свободен сейчас" },
  { id: "today", label: "Сегодня" },
  { id: "tomorrow", label: "Завтра" },
  { id: "week", label: "7 дней" },
  { id: "month", label: "30 дней" },
];

export default function EventMapControls({
  timeFilter,
  onTimeFilterChange,
  userCoords,
  onLocate,
  touristRoute,
  touristRoutePoints,
  touristRoadStatus,
  onCloseTouristRoute,
}) {
  return (
    <>
      <div
        className={styles.mapTimeFilters}
        role="group"
        aria-label="Фильтр событий по времени"
      >
        {TIME_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={timeFilter === filter.id ? styles.active : ""}
            aria-pressed={timeFilter === filter.id}
            onClick={() => onTimeFilterChange?.(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <button
        className={styles.locationButton}
        aria-label="Моё местоположение"
        onClick={onLocate}
        disabled={!userCoords}
      >
        <Icon name="compass" size={24} />
      </button>

      {touristRoutePoints.length > 0 && (
        <div className={styles.mapTouristModePlaque} role="status">
          <span className={styles.mapTouristModeIcon}>
            <Icon name="compass" size={19} />
          </span>
          <span className={styles.mapTouristModeCopy}>
            <strong>Туристический режим</strong>
            <small>
              {touristRoute.city || "Маршрут"} · Остановок:{" "}
              {touristRoutePoints.length}
            </small>
            <small>
              {touristRoadStatus.loading
                ? "Строим пеший маршрут по дорогам…"
                : touristRoadStatus.error
                  ? "Пеший путь не найден. Точки маршрута сохранены."
                  : touristRoadStatus.distanceMeters
                    ? `${(touristRoadStatus.distanceMeters / 1000).toFixed(
                        1,
                      )} км · около ${Math.round(
                        touristRoadStatus.durationSeconds / 60,
                      )} мин пешком`
                    : ""}
            </small>
          </span>
          <button
            type="button"
            className={styles.mapTouristModeClose}
            aria-label="Закрыть туристический маршрут"
            title="Скрыть маршрут"
            onClick={onCloseTouristRoute}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
    </>
  );
}
