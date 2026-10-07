import Icon from "../../components/Icon";
import styles from "./FriendsPage.module.css";

const TABS = [
  { id: "friends", label: "Друзья" },
  { id: "incoming", label: "Заявки" },
  { id: "outgoing", label: "Отправленные" },
];

export default function FriendsPageHeader({ counts, tab, onTabChange, query, onQueryChange }) {
  return (
    <>
      <div className="my-events-tabs my-events-tabs--three">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`my-tab ${tab === id ? "active" : ""}`}
            onClick={() => onTabChange(id)}
          >
            {label} ({counts[id]})
          </button>
        ))}
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon} aria-hidden="true">
          <Icon name="search" size={19} />
        </span>
        <input
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Найти человека по имени"
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => onQueryChange("")}
            aria-label="Очистить поиск"
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </div>
    </>
  );
}
