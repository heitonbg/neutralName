import styles from "./EventSkeleton.module.css";

const EventSkeleton = () => (
  <div className={`event-card-horizontal ${styles.card}`}>
    <div className={styles.image} />
    <div className="event-card-body">
      <div className={`${styles.line} ${styles.title}`} />
      <div className={`${styles.line} ${styles.text}`} />
      <div className={`${styles.line} ${styles.text} ${styles.short}`} />
      <div className={`${styles.line} ${styles.button}`} />
    </div>
  </div>
);

export const EventSkeletonList = ({ count = 3 }) => (
  <div className="event-feed">
    {Array.from({ length: count }).map((_, i) => (
      <EventSkeleton key={i} />
    ))}
  </div>
);

export default EventSkeleton;
