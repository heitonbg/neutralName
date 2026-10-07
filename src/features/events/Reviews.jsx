import { useState } from 'react';
import Icon from '../../components/Icon';
import { isEventOwner } from '../../utils/eventOwnership';
import { getEventStatus } from '../../utils/eventFilters';
import styles from './Reviews.module.css';

const Reviews = ({
  event,
  userId,
  userName,
  reviews = [],
  onSubmit,
  wasParticipant = false,
}) => {
  const isOwner = isEventOwner(event, userId);
  const isPast = getEventStatus(event) === 'past';

  const [rating, setRating] = useState(0);
  const [organizerRating, setOrganizerRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const myReview = reviews.find((r) => String(r.userId) === String(userId));
  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const organizerRatings = reviews
    .map((r) => r.organizerRating)
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 5);
  const averageOrganizerRating = organizerRatings.length
    ? (organizerRatings.reduce((sum, v) => sum + v, 0) / organizerRatings.length).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Поставьте оценку событию');
      return;
    }
    if (!text.trim()) {
      setError('Напишите отзыв');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        eventId: event.id,
        eventOrganizerId: event.organizerId ?? event.organizer?.id ?? null,
        userId,
        userName: userName || 'Гость',
        rating,
        organizerRating: organizerRating || null,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      });
      setRating(0);
      setOrganizerRating(0);
      setText('');
    } catch (err) {
      setError(err.message || 'Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="detail-section">
      <div className={styles.header}>
        <h3>Отзывы</h3>
        {isPast && reviews.length > 0 && (
          <span className={styles.average}>
            <Icon name="star" size={16} filled /> {averageRating} · {reviews.length}
          </span>
        )}
      </div>

      {!isPast ? (
        <p className={styles.empty}>Отзывы появятся после завершения события.</p>
      ) : (
        <>
          {averageOrganizerRating && (
            <p className={styles.organizerAverage}>
              Организатор: <Icon name="star" size={14} filled /> {averageOrganizerRating} из 5
            </p>
          )}

          {reviews.length === 0 ? (
            <p className={styles.empty}>Пока нет отзывов. Будьте первым!</p>
          ) : (
            <div className={styles.list}>
              {reviews.map((r) => (
                <div key={r.id} className={styles.item}>
                  <div className={styles.reviewHead}>
                    <strong>{r.userName || 'Гость'}</strong>
                    <span className={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Icon key={n} name="star" size={13} filled={n <= r.rating} />
                      ))}
                    </span>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                  {Number.isInteger(r.organizerRating) && (
                    <p className={styles.organizerRating}>
                      Организатор: {r.organizerRating} / 5
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {isOwner ? (
            <p className={styles.empty}>
              Вы организатор этого события и не можете оставить отзыв.
            </p>
          ) : !wasParticipant ? (
            <p className={styles.empty}>
              Оставить отзыв могут только участники события.
            </p>
          ) : myReview ? (
            <p className={styles.empty}>Вы уже оставили отзыв — спасибо!</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <span className={styles.formLabel}>Оценка события</span>
                <div className={styles.formStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={`event-${n}`}
                      className={`${styles.star} ${n <= rating ? styles.active : ''}`}
                      onClick={() => setRating(n)}
                      aria-label={`Оценка события ${n}`}
                    >
                      <Icon name="star" size={26} filled={n <= rating} />
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>
                  Оценка организатора (необязательно)
                </span>
                <div className={styles.formStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={`org-${n}`}
                      className={`${styles.star} ${n <= organizerRating ? styles.active : ''}`}
                      onClick={() => setOrganizerRating(organizerRating === n ? 0 : n)}
                      aria-label={`Оценка организатора ${n}`}
                    >
                      <Icon name="star" size={22} filled={n <= organizerRating} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className={styles.textarea}
                rows="3"
                maxLength={500}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Поделитесь впечатлениями о событии..."
              />
              {error && <p className={`error-text ${styles.formError}`}>{error}</p>}
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? 'Отправка...' : 'Оставить отзыв'}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
};

export default Reviews;