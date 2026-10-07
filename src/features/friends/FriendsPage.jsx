import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { observer } from "mobx-react-lite";
import Icon from "../../components/Icon";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useStore } from "../../store/StoreProvider";
import { openMaxChat } from "../../utils/maxBridge.js";
import FriendsDirectory from "./FriendsDirectory";
import FriendsPageHeader from "./FriendsPageHeader";
import styles from "./FriendsPage.module.css";

const normalizePerson = (entry) => {
  if (!entry) return null;
  const raw = entry.user ? entry.user : entry;
  if (!raw || raw.id == null) return null;
  return {
    id: String(raw.id),
    name: raw.name || "Пользователь",
    photo_url: raw.photo_url || null,
    city: raw.city || null,
    age: raw.age ?? null,
    about: raw.about || null,
    maxLink: raw.maxLink || "",
    friendshipStatus: raw.friendshipStatus ?? null,
    requestedByMe: Boolean(raw.requestedByMe),
  };
};

const normalizeList = (list) =>
  (Array.isArray(list) ? list : []).map(normalizePerson).filter(Boolean);

function FriendsPage({ onOpenProfile }) {
  const store = useStore();
  const friendsStore = store.friends;
  const userId = store.session.userId;
  const isGuestMode = store.ui.isGuestMode;
  const [tab, setTab] = useState("friends");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [busy, setBusy] = useState({});
  const friends = normalizeList(friendsStore.friends);
  const requests = {
    incoming: normalizeList(friendsStore.incoming),
    outgoing: normalizeList(friendsStore.outgoing),
  };

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await friendsStore.load();
    } catch (e) {
      setError(e?.message || "Не удалось загрузить друзей");
    } finally {
      setLoading(false);
    }
  }, [friendsStore, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userId) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    setError("");
    const controller = new AbortController();
    let active = true;
    const t = setTimeout(() => {
      friendsStore.search(q, { signal: controller.signal })
        .then((res) => {
          const results = Array.isArray(res)
            ? res
            : Array.isArray(res?.results)
              ? res.results
              : Array.isArray(res?.users)
                ? res.users
                : [];
          if (active) setSearchResults(normalizeList(results));
        })
        .catch((error) => {
          if (active && error.code !== "ERR_CANCELED") {
            setError(error.message || "Не удалось выполнить поиск");
          }
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
      controller.abort();
    };
  }, [friendsStore, query, userId]);

  const clearBusy = (id) => {
    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });
  };

  // ★ Отправить заявку. Оптимистично меняем UI.
  const handleRequest = async (person) => {
    if (!userId || busy[person.id]) return;
    setBusy((b) => ({ ...b, [person.id]: true }));
    setError("");
    try {
      const res = await friendsStore.request(person.id);
      const status = res?.status || "outgoing";

      // Убираем из результатов поиска.
      setSearchResults((prev) =>
        prev.map((p) =>
          p.id === person.id
            ? {
                ...p,
                friendshipStatus: status === "friends" ? "accepted" : "pending",
                requestedByMe: status !== "friends",
              }
            : p,
        ),
      );

      await load();
    } catch (e) {
      setError(e?.message || "Не удалось отправить заявку");
    } finally {
      clearBusy(person.id);
    }
  };

  // ★ Принять входящую.
  const handleAccept = async (person) => {
    if (!userId || busy[person.id]) return;
    setBusy((b) => ({ ...b, [person.id]: true }));
    setError("");
    try {
      await friendsStore.accept(person.id);
      await load();
    } catch (e) {
      setError(e?.message || "Не удалось принять заявку");
    } finally {
      clearBusy(person.id);
    }
  };

  // ★ Отклонить входящую / отменить исходящую.
  const handleDecline = async (person) => {
    if (!userId || busy[person.id]) return;
    setBusy((b) => ({ ...b, [person.id]: true }));
    setError("");
    try {
      await friendsStore.decline(person.id);
      setSearchResults((prev) =>
        prev.map((p) =>
          p.id === person.id
            ? { ...p, friendshipStatus: null, requestedByMe: false }
            : p,
        ),
      );
      await load();
    } catch (e) {
      setError(e?.message || "Не удалось отменить заявку");
    } finally {
      clearBusy(person.id);
    }
  };

  const handleRemove = async () => {
    if (!pendingRemove) return;
    const person = pendingRemove;
    setBusy((b) => ({ ...b, [person.id]: true }));
    setError("");
    try {
      await friendsStore.remove(person.id);
      setPendingRemove(null);
      await load();
    } catch (e) {
      setError(e?.message || "Не удалось удалить из друзей");
    } finally {
      clearBusy(person.id);
    }
  };

  const counts = useMemo(
    () => ({
      friends: friends.length,
      incoming: requests.incoming.length,
      outgoing: requests.outgoing.length,
    }),
    [friends.length, requests.incoming.length, requests.outgoing.length],
  );

  if (!userId) {
    return (
      <div className={styles.page}>
        <h2 className="page-title">Друзья</h2>
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="user" size={44} />
          </div>
          <h3>
            {isGuestMode ? "Режим просмотра" : "Подождите, загружаем профиль…"}
          </h3>
          <p>
            {isGuestMode
              ? "Список друзей доступен после входа через MAX."
              : "Как только MAX Bridge отдаст ваши данные, здесь появятся друзья."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className="page-title">Друзья</h2>

      <FriendsPageHeader
        counts={counts}
        tab={tab}
        onTabChange={setTab}
        query={query}
        onQueryChange={setQuery}
      />

      <FriendsDirectory
        tab={tab}
        query={query}
        error={error}
        loading={loading}
        searching={searching}
        searchResults={searchResults}
        friends={friends}
        incoming={requests.incoming}
        outgoing={requests.outgoing}
        busy={busy}
        onOpenProfile={onOpenProfile}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onRequest={handleRequest}
        onRemoveFriend={setPendingRemove}
        onOpenChat={openMaxChat}
      />

      {pendingRemove && (
        <ConfirmDialog
          title="Удалить из друзей?"
          description={`${
            pendingRemove.name || "Пользователь"
          } исчезнет из списка друзей. Заявку можно будет отправить снова после общего события.`}
          confirmLabel="Удалить"
          cancelLabel="Оставить"
          destructive
          busy={Boolean(busy[pendingRemove.id])}
          onCancel={() => setPendingRemove(null)}
          onConfirm={handleRemove}
        />
      )}
    </div>
  );
}

export default observer(FriendsPage);
