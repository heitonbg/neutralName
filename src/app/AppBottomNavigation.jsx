import Icon from "../components/Icon.jsx";

export default function AppBottomNavigation({
  activeTab,
  onNavigate,
  onCreate,
  onTrackCreate,
  incomingFriendsCount,
}) {
  return (
    <div className="bottom-nav">
      <button
        onClick={() => onNavigate("feed")}
        className={activeTab === "feed" ? "active" : ""}
      >
        <span className="icon">
          <Icon name="home" size={23} filled />
        </span>
        <span>Главная</span>
      </button>
      <button
        onClick={onCreate}
        onClickCapture={onTrackCreate}
        className={`create-btn ${activeTab === "create" ? "active" : ""}`}
      >
        <span className="icon-plus">
          <Icon name="plus" size={34} />
        </span>
      </button>
      <button
        onClick={() => onNavigate("my")}
        className={activeTab === "my" ? "active" : ""}
      >
        <span className="icon">
          <Icon name="user" size={23} />
        </span>
        <span>Мои события</span>
      </button>
      <button
        onClick={() => onNavigate("friends")}
        className={activeTab === "friends" ? "active" : ""}
      >
        <span className="icon">
          <Icon name="people" size={23} />
        </span>
        <span>Друзья</span>
        {incomingFriendsCount > 0 && (
          <span className="bottom-nav-badge">{incomingFriendsCount}</span>
        )}
      </button>
      <button
        onClick={() => onNavigate("profile")}
        className={activeTab === "profile" ? "active" : ""}
      >
        <span className="icon">
          <Icon name="user" size={23} />
        </span>
        <span>Профиль</span>
      </button>
    </div>
  );
}
