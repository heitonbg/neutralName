import React, { useState, useEffect, useMemo } from 'react';
import ConsentScreen from './components/ConsentScreen';
import DesktopSidebar from './components/DesktopSidebar';
import SearchBar from './components/SearchBar';
import EventFeed from './components/EventFeed';
import EventMap from './components/EventMap';
import EventDetailModal from './components/EventDetailModal';
import FiltersModal from './components/FiltersModal';
import CreateEventForm from './components/CreateEventForm';
import MyEvents from './components/MyEvents';
import Profile from './components/Profile';
import { EventSkeletonList } from './components/EventSkeleton';
import { fetchEvents, createEvent, joinEvent } from './api/events';
import { maxBridge } from './utils/maxBridge';
import { haversineDistance, formatDistance } from './utils/distance';
import './App.css';

function App() {
  const [consent, setConsent] = useState(
    () => localStorage.getItem('max_events_consent') === 'true'
  );
  const [activeTab, setActiveTab] = useState('feed');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [user, setUser] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const quickFilters = ['Сегодня', 'Бесплатно', 'Спорт', 'Культура', 'Онлайн'];

  useEffect(() => {
    maxBridge.init();
    const u = maxBridge.getUser();
    if (u) setUser(u);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }),
        () => console.log('Геолокация недоступна')
      );
    }

    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    if (quickFilter === 'Сегодня') {
      result = result.filter((e) => e.date.includes('Сегодня'));
    } else if (quickFilter === 'Бесплатно') {
      result = result.filter((e) => e.price === 'Бесплатно');
    } else if (quickFilter === 'Онлайн') {
      result = result.filter((e) => e.district === 'Онлайн');
    } else if (quickFilter) {
      result = result.filter((e) => e.category === quickFilter);
    }

    if (filters) {
      if (filters.category?.length) {
        result = result.filter((e) => filters.category.includes(e.category));
      }
      if (filters.price) {
        result = result.filter((e) => e.price === filters.price);
      }
      if (filters.format === 'Онлайн') {
        result = result.filter((e) => e.district === 'Онлайн');
      } else if (filters.format === 'Офлайн') {
        result = result.filter((e) => e.district !== 'Онлайн');
      }
    }

    if (userCoords) {
      result = result.map((e) => {
        if (e.lat && e.lng) {
          const dist = haversineDistance(
            userCoords.lat,
            userCoords.lng,
            e.lat,
            e.lng
          );
          return { ...e, distance: formatDistance(dist), _distanceValue: dist };
        }
        return { ...e, _distanceValue: 999 };
      });
      result.sort((a, b) => a._distanceValue - b._distanceValue);
    }

    return result;
  }, [events, searchQuery, quickFilter, filters, userCoords]);

  const handleConsent = () => {
    localStorage.setItem('max_events_consent', 'true');
    setConsent(true);
  };

  const handleJoinEvent = async (event) => {
    if (joinedIds.includes(event.id)) return;

    try {
      maxBridge.haptic('medium');
      await joinEvent(event.id, user?.id || 'guest');
      setJoinedIds((prev) => [...prev, event.id]);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, participants: e.participants + 1 } : e
        )
      );
      maxBridge.sendData({
        action: 'join_event',
        eventId: event.id,
        eventTitle: event.title,
        eventTime: event.eventTime || null
      });
      maxBridge.showAlert(`✅ Вы записались на "${event.title}"`);
    } catch (e) {
      maxBridge.showAlert('Не удалось присоединиться');
    }
  };

  const handleToggleLike = (eventId) => {
    setLikedIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleCreateEvent = async (newEvent) => {
    const created = await createEvent(newEvent);
    setEvents((prev) => [created, ...prev]);
    setActiveTab('feed');
    maxBridge.haptic('success');
    maxBridge.sendData({ action: 'create_event', title: created.title });
    maxBridge.showAlert(`🎉 Событие "${created.title}" создано!`);
  };

  const handleEventClick = (event) => setSelectedEvent(event);

  const handleApplyFilters = (f) => {
    setFilters(f);
    setQuickFilter(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('max_events_consent');
    setConsent(false);
  };

  if (!consent) {
    return <ConsentScreen onAccept={handleConsent} />;
  }

  const isExploreTab = activeTab === 'feed' || activeTab === 'map';

  return (
    <div className="app-container">
      <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        {isExploreTab && (
          <>
            <div className="mobile-header">
              <h1>
                События рядом
                <span className="header-location">
                  <span className="pin">📍</span>
                  Казань
                  <span className="chevron">▼</span>
                </span>
              </h1>
              {user && (
                <p className="greeting">
                  Больше, чем просто планы 💙
                </p>
              )}
            </div>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onOpenFilters={() => setIsFiltersOpen(true)}
            />

            <div className="tabs-row">
              <button
                className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                <span className="tab-icon">📅</span> Лента
              </button>
              <button
                className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                <span className="tab-icon">🗺️</span> Карта
              </button>
            </div>

            <div className="quick-filters">
              {quickFilters.map((f) => (
                <button
                  key={f}
                  className={`chip ${quickFilter === f ? 'active' : ''}`}
                  onClick={() => setQuickFilter(quickFilter === f ? null : f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="content-area">
          {loading ? (
            <EventSkeletonList count={3} />
          ) : (
            <>
              {activeTab === 'feed' && (
                <EventFeed
                  events={filteredEvents}
                  onJoin={handleJoinEvent}
                  onEventClick={handleEventClick}
                  joinedIds={joinedIds}
                  likedIds={likedIds}
                  onToggleLike={handleToggleLike}
                />
              )}

              {activeTab === 'map' && (
                <EventMap events={filteredEvents} onJoin={handleJoinEvent} />
              )}

              {activeTab === 'create' && (
                <CreateEventForm
                  onCreate={handleCreateEvent}
                  onCancel={() => setActiveTab('feed')}
                  userId={user?.id || 'guest'}
                  userName={user?.first_name || user?.name}
                />
              )}

              {activeTab === 'my' && (
                <MyEvents
                  events={events}
                  onJoin={handleJoinEvent}
                  onEventClick={handleEventClick}
                  joinedIds={joinedIds}
                  userId={user?.id || 'guest'}
                />
              )}

              {activeTab === 'profile' && (
                <Profile
                  user={user}
                  joinedIds={joinedIds}
                  createdCount={
                    events.filter(
                      (e) =>
                        e.organizer && e.organizer.id === (user?.id || 'guest')
                    ).length
                  }
                  onLogout={handleLogout}
                />
              )}
            </>
          )}
        </div>

        <div className="bottom-nav">
          <button
            onClick={() => setActiveTab('feed')}
            className={activeTab === 'feed' ? 'active' : ''}
          >
            <span className="icon">🏠</span>
            <span>Главная</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`create-btn ${activeTab === 'create' ? 'active' : ''}`}
          >
            <span className="icon-plus">+</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={activeTab === 'my' ? 'active' : ''}
          >
            <span className="icon">👤</span>
            <span>Мои события</span>
          </button>
        </div>
      </div>

      {isFiltersOpen && (
        <FiltersModal
          onClose={() => setIsFiltersOpen(false)}
          onApply={handleApplyFilters}
          initialFilters={filters}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onJoin={handleJoinEvent}
          isJoined={joinedIds.includes(selectedEvent.id)}
          userId={user?.id || 'guest'}
        />
      )}
    </div>
  );
}

export default App;