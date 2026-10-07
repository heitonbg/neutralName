import styles from "./FriendsPage.module.css";

const subtitleFor = (person) =>
  [person.age && `${person.age} лет`, person.city]
    .filter(Boolean)
    .join(" · ") || "Пользователь Вместе";

export default function PersonRow({ person, actions, onOpen }) {
  return (
    <div className={styles.personRow}>
      <button
        type="button"
        className={styles.personRowMain}
        onClick={() => onOpen?.(person)}
      >
        <span className={styles.personAvatar}>
          {person.photo_url ? (
            <img src={person.photo_url} alt={person.name || "Пользователь"} />
          ) : (
            (person.name || "П").slice(0, 1).toUpperCase()
          )}
        </span>
        <span className={styles.personMeta}>
          <strong>{person.name || "Пользователь"}</strong>
          <small>{subtitleFor(person)}</small>
        </span>
      </button>
      {actions && <div className={styles.personActions}>{actions}</div>}
    </div>
  );
}
