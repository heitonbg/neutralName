import Icon from "../components/Icon.jsx";
import SearchBar from "../components/SearchBar.jsx";
import styles from "./AppExploreHeader.module.css";

export default function AppExploreHeader({
  activeTab,
  selectedCity,
  user,
  isMenuOpen,
  onToggleMenu,
  onSetActiveTab,
  onOpenCityPicker,
  referenceCoords,
  searchQuery,
  onSearchChange,
  onOpenFilters,
  activeFiltersCount,
  savedTouristPlan,
  onOpenTouristPlan,
  visibleQuickFilters,
  quickFilter,
  onQuickFilterChange,
}) {
  return (
    <>
      <div className="mobile-header">
        <div className="mobile-title-row">
          <h1>
            События рядом{" "}
            <button
              className={styles.headerLocation}
              onClick={onOpenCityPicker}
            >
              <span className={styles.pin}>
                <Icon name="pin" size={17} filled />
              </span>
              {selectedCity?.name || "Город"}
              <span className={styles.chevron}>
                <Icon name="chevronDown" size={14} />
              </span>
            </button>
            {referenceCoords && (
              <span
                className={`geo-source-badge ${referenceCoords.source === "geo" ? "geo-source-badge--me" : ""}`}
                title={
                  referenceCoords.source === "geo"
                    ? "Расстояния считаются от вашего текущего местоположения"
                    : `Расстояния считаются от центра: ${selectedCity?.name || ""}`
                }
              >
                {referenceCoords.source === "geo"
                  ? "📍 от вас"
                  : "📍 от центра"}
              </span>
            )}
            {activeTab === "map" && (
              <span
                className="geo-source-badge geo-source-badge--world"
                title="На карте показаны события всех городов"
              >
                🗺️ все города
              </span>
            )}
          </h1>
          <button
            className={`header-more ${isMenuOpen ? "active" : ""}`}
            type="button"
            onClick={onToggleMenu}
            aria-label="Открыть меню"
            aria-expanded={isMenuOpen}
          >
            <Icon name="more" size={23} />
          </button>
        </div>
        {isMenuOpen && (
          <div className={styles.headerMenu}>
            <button type="button" onClick={() => onSetActiveTab("my")}>
              <Icon name="calendar" size={19} />
              Мои события
            </button>
            <button type="button" onClick={() => onSetActiveTab("profile")}>
              <Icon name="user" size={19} />
              Профиль
            </button>
          </div>
        )}
        {user && (
          <p className={styles.greeting}>Больше, чем просто планы</p>
        )}
      </div>

      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onOpenFilters={onOpenFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="tabs-row">
        <button
          className={`tab-btn ${activeTab === "feed" ? "active" : ""}`}
          onClick={() => onSetActiveTab("feed")}
        >
          <span className="tab-icon">
            <Icon name="calendar" size={21} />
          </span>{" "}
          Лента
        </button>
        <button
          className={`tab-btn ${activeTab === "map" ? "active" : ""}`}
          onClick={() => onSetActiveTab("map")}
        >
          <span className="tab-icon">
            <Icon name="map" size={21} />
          </span>{" "}
          Карта
        </button>
      </div>

      <div className={styles.touristModeEntry}>
        <button
          type="button"
          className={styles.touristModeButton}
          onClick={onOpenTouristPlan}
        >
          <span className={styles.touristModeIcon}>
            <Icon name="compass" size={21} />
          </span>
          <span className={styles.touristModeCopy}>
            <strong>
              {savedTouristPlan ? "Мой маршрут" : "Туристический маршрут"}
            </strong>
            <small>
              {savedTouristPlan
                ? `${savedTouristPlan.city} · ${savedTouristPlan.date}`
                : "Собрать план дня из событий города"}
            </small>
          </span>
          <Icon name="chevronRight" size={20} />
        </button>
      </div>

      <div
        className="quick-filters"
        tabIndex="0"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.preventDefault();
            event.currentTarget.scrollLeft += event.deltaY;
          }
        }}
      >
        {visibleQuickFilters.map((filter) => (
          <button
            key={filter}
            className={`chip ${quickFilter === filter ? "active" : ""}`}
            onClick={() =>
              onQuickFilterChange(quickFilter === filter ? null : filter)
            }
          >
            {filter}
          </button>
        ))}
      </div>
    </>
  );
}
