import styles from "./AppGuestModeBanner.module.css";

export default function AppGuestModeBanner({ isGuestMode, onEnter, onExit }) {
  if (!import.meta.env.DEV) return null;

  return (
    <aside className={styles.banner} role="status">
      {isGuestMode ? (
        <>
          <span>
            Гостевой режим: просмотр и локальные настройки. Операции, требующие
            входа через MAX, заблокированы.
          </span>
          <button type="button" onClick={onExit}>
            Выйти
          </button>
        </>
      ) : (
        <>
          <span>Проверяете интерфейс без MAX?</span>
          <button type="button" onClick={onEnter}>
            Включить гостевой режим
          </button>
        </>
      )}
    </aside>
  );
}
