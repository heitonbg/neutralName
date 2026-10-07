import { useRef } from "react";
import Icon from "../../components/Icon";
import styles from "./CreateEventForm.module.css";

export default function EventImageFields({
  images,
  error,
  onChoose,
  onRemove,
}) {
  const fileInputRef = useRef(null);
  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="form-group">
      <label>Фотографии события</label>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={onChoose}
      />
      <div
        className={styles.imageUploadRow}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          if (!event.target.closest("button")) openFilePicker();
        }}
        onKeyDown={(event) => {
          if (
            !event.target.closest("button") &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            openFilePicker();
          }
        }}
      >
        <div className={styles.imagePreviewStrip}>
          {images.length ? (
            images.map(({ src, index }) => (
              <div
                className={styles.imagePreviewItem}
                key={`${src.slice(0, 32)}-${index}`}
              >
                <img src={src} alt={`Фото ${index + 1}`} />
                <button type="button" onClick={() => onRemove(index)}>
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))
          ) : (
            <button
              type="button"
              className={styles.imagePlaceholder}
              onClick={openFilePicker}
              aria-label="Выбрать фотографии"
            >
              <Icon name="edit" size={25} />
            </button>
          )}
        </div>
        <div>
          <button
            type="button"
            className={styles.uploadImageButton}
            onClick={openFilePicker}
          >
            Добавить фотографии
          </button>
          <p>Нажмите, чтобы выбрать фотографии. До 5 фото, PNG/JPG/WEBP.</p>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
