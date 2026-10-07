import Icon from "./Icon";

export default function FriendProfileActions({
  person,
  isSelf,
  currentUserId,
  friendStatus,
  statusLoading,
  busy,
  onOpenChat,
  onAddFriend,
  onDecline,
  onRemoveFriend,
}) {
  if (isSelf || !currentUserId) return null;
  if (statusLoading) {
    return (
      <button type="button" className="friend-action-btn" disabled>
        Загрузка…
      </button>
    );
  }
  if (friendStatus === "friends") {
    return (
      <>
        <button
          type="button"
          className="friend-action-btn friend-action-btn--chat"
          onClick={onOpenChat}
          disabled={!person?.maxLink}
          title={
            person?.maxLink
              ? "Написать в MAX"
              : "Пользователь пока не добавил ссылку на MAX"
          }
        >
          <Icon name="share" size={17} /> Написать в MAX
        </button>
        <button
          type="button"
          className="friend-action-btn friend-action-btn--danger"
          onClick={onRemoveFriend}
          disabled={busy}
        >
          Удалить из друзей
        </button>
      </>
    );
  }
  if (friendStatus === "outgoing") {
    return (
      <button type="button" className="friend-action-btn" disabled>
        Заявка отправлена
      </button>
    );
  }
  if (friendStatus === "incoming") {
    return (
      <>
        <button
          type="button"
          className="friend-action-btn friend-action-btn--primary"
          onClick={onAddFriend}
          disabled={busy}
        >
          Принять заявку
        </button>
        <button
          type="button"
          className="friend-action-btn friend-action-btn--danger"
          onClick={onDecline}
          disabled={busy}
        >
          Отклонить
        </button>
      </>
    );
  }
  return (
    <button
      type="button"
      className="friend-action-btn friend-action-btn--primary"
      onClick={onAddFriend}
      disabled={busy}
    >
      <Icon name="people" size={17} /> Добавить в друзья
    </button>
  );
}
