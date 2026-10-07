import Icon from "../../components/Icon";
import PersonRow from "./PersonRow";
import styles from "./FriendsPage.module.css";

export default function FriendsDirectory({
  tab,
  query,
  error,
  loading,
  searching,
  searchResults,
  friends,
  incoming,
  outgoing,
  busy,
  onOpenProfile,
  onAccept,
  onDecline,
  onRequest,
  onRemoveFriend,
  onOpenChat,
}) {
  const searchingByName = query.trim().length >= 2;

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {searchingByName && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {searching ? "Ищем…" : `Найдено: ${searchResults.length}`}
          </h3>
          {!searching && searchResults.length === 0 && (
            <p className={styles.empty}>
              Среди тех, с кем вы были на событиях, никого не нашлось.
            </p>
          )}
          <div className={styles.list}>
            {searchResults.map((person) => {
              const isFriend = person.friendshipStatus === "accepted";
              const isPendingMe =
                person.friendshipStatus === "pending" && person.requestedByMe;
              const isPendingThem =
                person.friendshipStatus === "pending" && !person.requestedByMe;
              let actions = null;

              if (isFriend) {
                actions = <span className={styles.badge}>Уже друзья</span>;
              } else if (isPendingMe) {
                actions = (
                  <>
                    <span className={`${styles.badge} ${styles.muted}`}>
                      Заявка отправлена
                    </span>
                    <button
                      type="button"
                      className={`${styles.friendButton} ${styles.danger}`}
                      disabled={busy[person.id]}
                      onClick={() => onDecline(person)}
                    >
                      Отменить
                    </button>
                  </>
                );
              } else if (isPendingThem) {
                actions = (
                  <>
                    <button
                      type="button"
                      className={`${styles.friendButton} ${styles.primary}`}
                      disabled={busy[person.id]}
                      onClick={() => onAccept(person)}
                    >
                      Принять
                    </button>
                    <button
                      type="button"
                      className={`${styles.friendButton} ${styles.danger}`}
                      disabled={busy[person.id]}
                      onClick={() => onDecline(person)}
                    >
                      Отклонить
                    </button>
                  </>
                );
              } else {
                actions = (
                  <button
                    type="button"
                    className={`${styles.friendButton} ${styles.primary}`}
                    disabled={busy[person.id]}
                    onClick={() => onRequest(person)}
                  >
                    <Icon name="plus" size={15} /> Добавить
                  </button>
                );
              }

              return (
                <PersonRow
                  key={person.id}
                  person={person}
                  actions={actions}
                  onOpen={onOpenProfile}
                />
              );
            })}
          </div>
        </section>
      )}

      {tab === "friends" && !searchingByName && (
        <section className={styles.section}>
          {loading ? (
            <p className={styles.empty}>Загружаем…</p>
          ) : friends.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="people" size={44} />
              </div>
              <h3>Пока нет друзей</h3>
              <p>
                Запишитесь на событие — после него сможете добавить в друзья
                тех, с кем познакомились.
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {friends.map((friend) => (
                <PersonRow
                  key={friend.id}
                  person={friend}
                  onOpen={onOpenProfile}
                  actions={
                    <>
                      <button
                        type="button"
                        className={styles.friendButton}
                        onClick={() => onOpenChat(friend.maxLink)}
                        disabled={!friend.maxLink}
                        title={
                          friend.maxLink
                            ? "Написать в MAX"
                            : "Пользователь пока не добавил ссылку на MAX"
                        }
                      >
                        <Icon name="share" size={15} /> Написать
                      </button>
                      <button
                        type="button"
                        className={`${styles.friendButton} ${styles.danger}`}
                        disabled={busy[friend.id]}
                        onClick={() => onRemoveFriend(friend)}
                        title="Удалить из друзей"
                      >
                        Удалить
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "incoming" && !searchingByName && (
        <section className={styles.section}>
          {incoming.length === 0 ? (
            <p className={styles.empty}>Входящих заявок нет.</p>
          ) : (
            <div className={styles.list}>
              {incoming.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onOpen={onOpenProfile}
                  actions={
                    <>
                      <button
                        type="button"
                        className={`${styles.friendButton} ${styles.primary}`}
                        disabled={busy[person.id]}
                        onClick={() => onAccept(person)}
                      >
                        Принять
                      </button>
                      <button
                        type="button"
                        className={`${styles.friendButton} ${styles.danger}`}
                        disabled={busy[person.id]}
                        onClick={() => onDecline(person)}
                      >
                        Отклонить
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "outgoing" && !searchingByName && (
        <section className={styles.section}>
          {outgoing.length === 0 ? (
            <p className={styles.empty}>Исходящих заявок нет.</p>
          ) : (
            <div className={styles.list}>
              {outgoing.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onOpen={onOpenProfile}
                  actions={
                    <>
                      <span className={`${styles.badge} ${styles.muted}`}>
                        Заявка отправлена
                      </span>
                      <button
                        type="button"
                        className={`${styles.friendButton} ${styles.danger}`}
                        disabled={busy[person.id]}
                        onClick={() => onDecline(person)}
                      >
                        Отменить
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
