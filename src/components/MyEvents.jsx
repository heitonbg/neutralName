import React, { useState } from 'react';
import EventCard from './EventCard';

const MyEvents = ({ events, onJoin, onEventClick, joinedIds, userId }) => {
  const [tab, setTab] = useState('joined'); // 'joined' | 'created'

  // События, на которые я записался
  const joinedEvents = events.filter((e) => joinedIds.includes(e.id));

  // События, которые создал я
  const createdEvents = events.filter(
    (e) => e.organizer && e.organizer.id === userId
  );

  const displayEvents = tab === 'joined' ? joinedEvents : createdEvents;

  return (
    <div className="my-events-page">
      <h2 className="page-title">Мои события</h2>

      <div className="my-events-tabs">
        <button
          className={`my-tab ${tab === 'joined' ? 'active' : ''}`}
          onClick={() => setTab('joined')}
        >
          🎟️ Я участвую ({joinedEvents.length})
        </button>
        <button
          className={`my-tab ${tab === 'created' ? 'active' : ''}`}
          onClick={() => setTab('created')}
        >
          ✨ Я создал ({createdEvents.length})
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab === 'joined' ? '🎟️' : '✨'}</div>
          <h3>
            {tab === 'joined'
              ? 'Вы пока не участвуете ни в одном событии'
              : 'Вы пока не создали ни одного события'}
          </h3>
          <p>
            {tab === 'joined'
              ? 'Найдите интересное событие в ленте и присоединитесь'
              : 'Нажмите «+» внизу, чтобы создать своё первое событие'}
          </p>
        </div>
      ) : (
        <div className="event-feed">
          {displayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onJoin={onJoin}
              onClick={onEventClick}
              isJoined={joinedIds.includes(event.id)}
              isOwner={event.organizer && event.organizer.id === userId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;