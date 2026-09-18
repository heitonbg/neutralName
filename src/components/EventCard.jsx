import React from 'react';

const EventCard = ({
  event,
  onJoin,
  onClick,
  isJoined,
  isLiked,
  onToggleLike
}) => {
  const displayLocation = isJoined ? event.address : event.district;

  return (
    <div className="event-card-horizontal" onClick={() => onClick(event)}>
      <div className="event-card-image">
        <img src={event.image} alt={event.title} loading="lazy" />
        <span className={`badge ${event.price === 'Бесплатно' ? 'free' : 'paid'}`}>
          {event.price}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-card-top">
          <span className="category-tag">{event.category}</span>
          <button
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(event.id);
            }}
            aria-label="Нравится"
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
        </div>

        <h3>{event.title}</h3>
        <p className="event-card-description">{event.description}</p>

        <div className="event-card-meta">
          <span>📅 {event.date}</span>
          <span>📍 {event.distance}</span>
          <span>👥 {event.participants} участников</span>
        </div>

        <button
          className="join-btn-small"
          onClick={(e) => {
            e.stopPropagation();
            onJoin(event);
          }}
          disabled={isJoined}
        >
          {isJoined ? '✓ Участвую' : 'Присоединиться'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;