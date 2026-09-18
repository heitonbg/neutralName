import React, { useState } from 'react';
import { reportEvent } from '../api/events';

const EventDetailModal = ({ event, onClose, onJoin, isJoined, userId }) => {
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  if (!event) return null;

  const handleReport = async (reason) => {
    try {
      await reportEvent(event.id, reason, userId);
      setReportSent(true);
      setTimeout(() => {
        setShowReport(false);
        setReportSent(false);
      }, 2000);
    } catch (e) {
      alert('Не удалось отправить жалобу');
    }
  };

  const handleShare = (event) => {
    const shareText =
      `🎉 ${event.title}\n` +
      `📅 ${event.date}\n` +
      `📍 ${isJoined ? event.address : event.district}\n\n` +
      `Присоединяйся!`;

    // Через MAX Bridge — нативный диалог шаринга
    if (window.MAXWebApp?.shareURL) {
      try {
        window.MAXWebApp.shareURL(
          `https://max.ru/events/${event.id}`,
          shareText
        );
        return;
      } catch (e) {
        console.warn('shareURL failed', e);
      }
    }

    // Fallback — копируем в буфер обмена
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareText)
        .then(() => alert('✅ Ссылка скопирована в буфер обмена'))
        .catch(() => alert(shareText));
    } else {
      alert(shareText);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="close-btn-floating">
          ✕
        </button>

        <img src={event.image} alt={event.title} className="detail-image" />

        <div className="detail-body">
          <div className="detail-badges">
            <span
              className={`badge ${
                event.price === 'Бесплатно' ? 'free' : 'paid'
              }`}
            >
              {event.price}
            </span>
            <span className="badge category">{event.category}</span>
          </div>

          <h2>{event.title}</h2>

          {event.rating > 0 && (
            <div className="detail-rating">
              ★ <strong>{event.rating}</strong> ({event.reviewsCount} отзывов)
            </div>
          )}

          <p className="detail-description">{event.description}</p>

          <div className="detail-info-list">
            <div className="detail-info-row">
              <span>📅</span>
              <span>{event.date}</span>
            </div>
            <div className="detail-info-row">
              <span>📍</span>
              <span>{isJoined ? event.address : event.district}</span>
            </div>
            <div className="detail-info-row">
              <span>👥</span>
              <span>
                {event.participants} / {event.maxParticipants} участников
              </span>
            </div>
            {event.organizer && (
              <div className="detail-info-row">
                <span>{event.organizer.avatar || '👤'}</span>
                <span>Организатор: {event.organizer.name}</span>
              </div>
            )}
          </div>

          <div className="detail-actions">
            {!isJoined ? (
              <button className="primary-btn" onClick={() => onJoin(event)}>
                Присоединиться
              </button>
            ) : (
              <button className="primary-btn disabled" disabled>
                ✓ Вы уже участвуете
              </button>
            )}

            <button className="share-btn" onClick={() => handleShare(event)}>
              📤 Поделиться
            </button>
          </div>

          <button
            className="report-btn"
            onClick={() => setShowReport(!showReport)}
          >
            ⚠️ Пожаловаться
          </button>

          {showReport && (
            <div className="report-menu">
              {reportSent ? (
                <p className="report-success">✓ Жалоба отправлена</p>
              ) : (
                <>
                  <button onClick={() => handleReport('spam')}>
                    Спам / реклама
                  </button>
                  <button onClick={() => handleReport('violence')}>
                    Насилие / угрозы
                  </button>
                  <button onClick={() => handleReport('stalking')}>
                    Домогательства
                  </button>
                  <button onClick={() => handleReport('other')}>Другое</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;