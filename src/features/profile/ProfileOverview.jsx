import Icon from "../../components/Icon";
import LegalDocument from "../../components/LegalDocument.jsx";
import styles from "./ProfileOverview.module.css";

export default function ProfileOverview({
  joinedCount,
  createdCount,
  friendsCount,
  incomingRequestsCount,
  notificationsOn,
  onToggleNotifications,
  isDark,
  onToggleTheme,
  onOpenFriends,
  showAbout,
  onToggleAbout,
  legalPage,
  onLegalPageChange,
}) {
  return (
    <>
      <div className={styles.profileStats}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{joinedCount}</div>
          <div className={styles.statLabel}>Участий</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{createdCount}</div>
          <div className={styles.statLabel}>Создано</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{friendsCount}</div>
          <div className={styles.statLabel}>Друзей</div>
        </div>
      </div>

      <div className={styles.profileSection}>
        <h4>Общение</h4>
        <button
          className={styles.settingsRowButton}
          type="button"
          onClick={onOpenFriends}
        >
          <span>
            <Icon name="people" size={19} /> Друзья
            {incomingRequestsCount > 0 && (
              <span className={styles.settingsBadge}>
                {incomingRequestsCount}
              </span>
            )}
          </span>
          <span>▶</span>
        </button>
      </div>

      <div className={styles.profileSection}>
        <h4>Настройки</h4>
        <div className={styles.settingsRow}>
          <span>
            <Icon name="calendar" size={19} /> Уведомления о событиях
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(notificationsOn)}
              onChange={(event) =>
                onToggleNotifications?.(event.target.checked)
              }
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className={styles.settingsRow}>
          <span>
            <Icon name="grid" size={19} /> Тёмная тема
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isDark}
              onChange={(event) =>
                onToggleTheme?.(event.target.checked ? "dark" : "light")
              }
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className={styles.profileSection}>
        <h4>О приложении</h4>
        <button
          className={styles.settingsRowButton}
          type="button"
          onClick={onToggleAbout}
        >
          <span>О Вместе</span>
          <span>{showAbout ? "▼" : "▶"}</span>
        </button>
        {showAbout && (
          <div className={styles.aboutText}>
            <p>
              <strong>Вместе</strong> — сервис для поиска и создания досуговых
              событий: спорт, настолки, культура, кино.
            </p>
            <p>Версия: 1.0.0 (MVP)</p>
            <p>
              Разработчик: команда <strong>нейтральное название</strong>
            </p>
            <p>Обработка данных: 152-ФЗ</p>
            <p>Модерация контента: активна</p>
          </div>
        )}
      </div>

      <div className={styles.profileSection}>
        <button
          className={styles.settingsRowButton}
          type="button"
          onClick={() => onLegalPageChange("privacy")}
        >
          <span>Политика конфиденциальности</span>
          <span>▶</span>
        </button>
        <button
          className={styles.settingsRowButton}
          type="button"
          onClick={() => onLegalPageChange("terms")}
        >
          <span>Пользовательское соглашение</span>
          <span>▶</span>
        </button>
      </div>

      {legalPage && (
        <LegalDocument
          type={legalPage}
          onClose={() => onLegalPageChange(null)}
          onSwitch={onLegalPageChange}
        />
      )}

      <p className={styles.profileFooter}>
        © 2026 Вместе · Команда <strong>нейтральное название</strong>
      </p>
    </>
  );
}
