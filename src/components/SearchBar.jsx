import Icon from "./Icon";
import styles from "./SearchBar.module.css";

const SearchBar = ({
  value,
  onChange,
  onOpenFilters,
  activeFiltersCount = 0,
}) => {
  return (
    <div className="search-bar">
      <span className={styles.searchIcon}>
        <Icon name="search" size={22} />
      </span>
      <input
        className={styles.input}
        type="text"
        placeholder="Что хотите поделать?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className={styles.filterButton}
        onClick={onOpenFilters}
        aria-label={`Фильтры${activeFiltersCount ? `, активно: ${activeFiltersCount}` : ""}`}
      >
        <Icon name="sliders" size={23} />
        {activeFiltersCount > 0 && (
          <span className={styles.filterBadge}>{activeFiltersCount}</span>
        )}
      </button>
    </div>
  );
};

export default SearchBar;
