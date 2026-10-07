import { useEffect, useRef } from 'react';
import styles from './DeleteEventDialog.module.css';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return undefined;
    element.showModal();
    return () => {
      try { element.close(); } catch {}
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-description">{description}</p>
      <div className={styles.actions}>
        <button type="button" autoFocus disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={destructive ? styles.confirm : ''}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? 'Подождите…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}