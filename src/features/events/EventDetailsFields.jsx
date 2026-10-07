import Icon from "../../components/Icon";

export default function EventDetailsFields({
  formData,
  errors,
  setField,
  isOnline,
  publicPlaceConfirmed,
  setPublicPlaceConfirmed,
  submitting,
  isEdit,
}) {
  return (
    <>
      <div className="form-group">
        <label>Лимит участников</label>
        <div className="limit-row">
          <div className={`input-with-icon ${errors.limit ? "error" : ""}`}>
            <span className="input-icon">
              <Icon name="people" size={21} />
            </span>
            <input
              type="number"
              min="1"
              value={formData.limit}
              onChange={(event) => setField("limit", event.target.value)}
              placeholder="Например, 20"
            />
          </div>
          <span className="limit-hint">
            Оставьте пустым,
            <br />
            если нет ограничений
          </span>
        </div>
        {errors.limit && <p className="error-text">{errors.limit}</p>}
      </div>

      <div className="form-group">
        <label>Ссылка на чат в MAX (необязательно)</label>
        <div className="input-with-icon">
          <span className="input-icon">
            <Icon name="share" size={19} />
          </span>
          <input
            type="url"
            value={formData.maxChatUrl}
            onChange={(event) => setField("maxChatUrl", event.target.value)}
            placeholder="https://max.ru/join/..."
          />
        </div>
        <p className="hint-text-with-icon">
          Участники смогут открыть чат из карточки события.
        </p>
      </div>

      <div className="form-group">
        <label>Описание</label>
        <div
          className={`textarea-with-icon ${errors.description ? "error" : ""}`}
        >
          <span className="textarea-icon">
            <Icon name="edit" size={21} />
          </span>
          <textarea
            rows="5"
            maxLength={1000}
            value={formData.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Расскажите подробнее о событии: что будет и какая атмосфера?"
          />
        </div>
        <p className="char-counter">{formData.description.length}/1000</p>
        {errors.description && (
          <p className="error-text">{errors.description}</p>
        )}
      </div>

      <div className="form-group">
        <label>Стоимость</label>
        <div className="format-segmented event-price-options">
          {["Бесплатно", "Платно", "Пушкинская карта"].map((price) => (
            <button
              type="button"
              key={price}
              className={formData.price === price ? "active" : ""}
              onClick={() => {
                setField("price", price);
                if (price !== "Платно") setField("priceAmount", "");
              }}
            >
              {price}
            </button>
          ))}
        </div>
        {formData.price === "Платно" && (
          <label className="event-price-amount">
            Стоимость, ₽
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={formData.priceAmount}
              onChange={(event) => setField("priceAmount", event.target.value)}
              placeholder="Например, 500"
              aria-invalid={Boolean(errors.priceAmount)}
            />
            {errors.priceAmount && (
              <span className="error-text">{errors.priceAmount}</span>
            )}
          </label>
        )}
      </div>

      {!isOnline && (
        <>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="publicPlace"
              checked={publicPlaceConfirmed}
              onChange={(event) =>
                setPublicPlaceConfirmed(event.target.checked)
              }
            />
            <label htmlFor="publicPlace">
              Подтверждаю, что мероприятие проходит в общественном месте
            </label>
          </div>
          {errors.publicPlace && (
            <p className="error-text public-place-error">
              {errors.publicPlace}
            </p>
          )}
        </>
      )}

      {errors.submit && (
        <p className="error-text submit-error">{errors.submit}</p>
      )}

      <button type="submit" className="submit-btn-v2" disabled={submitting}>
        {submitting
          ? "Сохраняем..."
          : isEdit
            ? "Сохранить изменения"
            : "Создать событие"}
      </button>
    </>
  );
}
