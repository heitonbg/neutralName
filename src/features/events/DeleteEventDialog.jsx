import { useEffect, useRef } from 'react';
import styles from '../../components/DeleteEventDialog.module.css';

export default function DeleteEventDialog({ event, busy, error, onCancel, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="delete-event-title" aria-describedby="delete-event-description" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="delete-event-title">Удалить событие?</h2>
    <p id="delete-event-description">«{event.title}» исчезнет из списков и с карты. Отменить удаление нельзя.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}>
      <button type="button" autoFocus disabled={busy} onClick={onCancel}>Оставить</button>
      <button type="button" className={styles.confirm} disabled={busy} onClick={onConfirm}>{busy ? 'Удаление…' : 'Удалить'}</button>
    </div>
  </dialog>;
}
