import Icon from '../../components/Icon';
import styles from './ParticipantsModal.module.css';

const labelCount = (event, participants) =>
  Math.max(Number(event.participants) || 0, participants.length);

export default function ParticipantsModal({
  event,
  participants,
  loading,
  onClose,
  onOpenProfile,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className={`modal-content ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="participants-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="participants-title">Участники</h2>
            <p>{event.title}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={22} />
          </button>
        </div>

        <p className={styles.count}>
          {labelCount(event, participants)} записались
          {!loading &&
            participants.length < labelCount(event, participants) &&
            ` · профили: ${participants.length} из ${labelCount(event, participants)}`}
        </p>

        {loading ? (
          <div className={styles.list}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.row} style={{ opacity: 0.5 }}>
                <span className={styles.avatar} />
                <span>
                  <strong>Загрузка…</strong>
                  <small />
                </span>
              </div>
            ))}
          </div>
        ) : participants.length === 0 ? (
          <p className={styles.empty}>Профили участников пока недоступны</p>
        ) : (
          <div className={styles.list}>
            {participants.map((person) => (
              <button
                className={styles.row}
                key={person.id}
                onClick={() => onOpenProfile(person)}
              >
                <span className={styles.avatar}>
                  {(person.name || 'У').slice(0, 1).toUpperCase()}
                  {person.photo_url && (
                    <img
                      src={person.photo_url}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.hidden = true;
                      }}
                    />
                  )}
                </span>
                <span>
                  <strong>{person.name || 'Участник'}</strong>
                  <small>
                    {person.isOrganizer
                      ? 'Организатор'
                      : [person.age && `${person.age} лет`, person.city]
                          .filter(Boolean)
                          .join(' · ') || 'Участник'}
                  </small>
                </span>
                <Icon name="chevronRight" size={20} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}