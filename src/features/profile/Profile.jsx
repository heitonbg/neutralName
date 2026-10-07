import { useEffect, useRef, useState } from 'react';
import { searchCities, findCityByName } from '../../utils/citySearch';
import { extractMaxUserLink } from '../../utils/maxBridge';
import styles from './Profile.module.css';
import ProfileOverview from './ProfileOverview.jsx';

const Profile = ({
  user, joinedIds, createdCount,
  friendsCount = 0,
  incomingRequestsCount = 0,
  onOpenFriends,
  notificationsOn, onToggleNotifications,
  theme, onToggleTheme,
  profile = {}, onSaveProfile,
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
  const [draft, setDraft] = useState(profile);
  const [cityQuery, setCityQuery] = useState(profile.city || '');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityError, setCityError] = useState('');
  const [maxLinkError, setMaxLinkError] = useState('');
  const cityInputRef = useRef(null);

  // ★ Флаг: пользователь только что выбрал город из подсказки.
  //   Пока он установлен, handleCityBlur не должен показывать «город не найден».
  const pickedFromSuggestionsRef = useRef(false);

  useEffect(() => {
    setDraft(profile);
    setCityQuery(profile.city || '');
    setCityError('');
    setMaxLinkError('');
    pickedFromSuggestionsRef.current = false;
  }, [profile]);

  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Гость';

  const userInitial = userName.charAt(0).toUpperCase();
  const isDark = theme === 'dark';

  const handleCityChange = (value) => {
    // ★ Если пользователь снова начал печатать — сбрасываем флаг.
    pickedFromSuggestionsRef.current = false;
    setCityQuery(value);
    setCityError('');
    setDraft((prev) => ({ ...prev, city: value }));
    if (value.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    setCitySuggestions(searchCities(value, 8));
  };

  const handleCityPick = (picked) => {
    // ★ Ставим флаг, чтобы blur знал: это осознанный выбор.
    pickedFromSuggestionsRef.current = true;
    setCityQuery(picked.name);
    setDraft((prev) => ({ ...prev, city: picked.name }));
    setCitySuggestions([]);
    setCityError('');
    cityInputRef.current?.blur();
  };

  const handleCityBlur = () => {
    setTimeout(() => {
      setCitySuggestions([]);

      // ★ Свежий выбор из подсказки — не проверяем ввод.
      if (pickedFromSuggestionsRef.current) {
        pickedFromSuggestionsRef.current = false;
        return;
      }

      const typed = cityQuery.trim();
      if (!typed) return;

      const match = findCityByName(typed);
      if (!match) {
        setCityError('Город не найден в справочнике. Выберите из подсказок.');
      } else {
        setCityQuery(match.name);
        setDraft((prev) => ({ ...prev, city: match.name }));
      }
    }, 120);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const maxLinkText = String(draft.maxLink || '').trim();
    const maxLink = extractMaxUserLink(maxLinkText);
    if (maxLinkText && !maxLink) {
      setMaxLinkError('Вставьте приглашение из MAX со ссылкой вида https://max.ru/u/…');
      return;
    }

    const typed = cityQuery.trim();
    if (typed) {
      const match = findCityByName(typed);
      if (!match) {
        setCityError('Город не найден в справочнике. Выберите из подсказок.');
        return;
      }
      setDraft((prev) => ({ ...prev, city: match.name }));
    }

    onSaveProfile?.({
      ...draft,
      city: typed ? findCityByName(typed)?.name || '' : '',
      maxLink,
    });
    setIsEditing(false);
  };

  return (
    <div className={styles.profilePage}>
      <h2 className="page-title">Профиль</h2>

      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>
          {user?.photo_url ? (
            <img src={user.photo_url} alt={userName} />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>
        <div className={styles.profileInfo}>
          <h3>{userName}</h3>
          <p className={styles.profileId}>
            {[draft.age && `${draft.age} лет`, draft.city].filter(Boolean).join(' · ') ||
              (user?.id ? `ID: ${user.id}` : 'Гость')}
          </p>
          <p className={styles.profileUsername}>
            {user?.username ? `@${user.username}` : ''}
          </p>
        </div>
        <button
          className={styles.profileEditButton}
          onClick={() => setIsEditing((value) => !value)}
        >
          {isEditing ? 'Отмена' : 'Изменить'}
        </button>
      </div>

      {isEditing ? (
        <form
          className={`${styles.profileSection} ${styles.profileEditForm}`}
          onSubmit={handleSubmit}
        >
          <h4>О себе</h4>

          <label>
            Возраст
            <input
              type="number"
              min="14"
              max="120"
              value={draft.age || ''}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  age: e.target.value ? Number(e.target.value) : '',
                }))
              }
              placeholder="Например, 24"
            />
          </label>

          <label>
            Город
            <div className={styles.profileCityField}>
              <input
                ref={cityInputRef}
                maxLength="80"
                value={cityQuery}
                onChange={(e) => handleCityChange(e.target.value)}
                onBlur={handleCityBlur}
                onFocus={() => {
                  if (cityQuery.trim().length >= 2) {
                    setCitySuggestions(searchCities(cityQuery, 8));
                  }
                }}
                placeholder="Например, Казань"
                autoComplete="off"
              />

              {citySuggestions.length > 0 && (
                <ul className={styles.profileCitySuggestions}>
                  {citySuggestions.map((c) => (
                    <li key={`${c.geonameid}-${c.name}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCityPick(c)}
                      >
                        <span>
                          <strong>{c.name}</strong>
                          {c.regionName && <small>{c.regionName}</small>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {cityError && <p className="error-text">{cityError}</p>}
          </label>

          <label>
            О себе
            <textarea
              rows="4"
              maxLength="500"
              value={draft.about || ''}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, about: e.target.value }))
              }
              placeholder="Расскажите, чем любите заниматься"
            />
          </label>

          <label>
            Ссылка на профиль в MAX
            <input
              type="text"
              value={draft.maxLink || ''}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, maxLink: e.target.value }));
                setMaxLinkError('');
              }}
              placeholder="Вставьте скопированный текст из MAX"
              aria-describedby="profile-max-link-hint"
            />
            <small id="profile-max-link-hint" className={styles.profileLinkHint}>
              Вставьте текст приглашения из MAX — ссылка на профиль сохранится автоматически.
            </small>
            {maxLinkError && <small className="error-text">{maxLinkError}</small>}
          </label>

          <button className="primary-btn" type="submit">
            Сохранить профиль
          </button>
        </form>
      ) : draft.about ? (
        <section className={`${styles.profileSection} ${styles.profileAbout}`}>
          <h4>О себе</h4>
          <p>{draft.about}</p>
        </section>
      ) : null}

      <ProfileOverview
        joinedCount={joinedIds.length}
        createdCount={createdCount}
        friendsCount={friendsCount}
        incomingRequestsCount={incomingRequestsCount}
        notificationsOn={notificationsOn}
        onToggleNotifications={onToggleNotifications}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenFriends={onOpenFriends}
        showAbout={showAbout}
        onToggleAbout={() => setShowAbout((shown) => !shown)}
        legalPage={legalPage}
        onLegalPageChange={setLegalPage}
      />
    </div>
  );
};

export default Profile;