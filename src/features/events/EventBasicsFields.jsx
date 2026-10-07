import Icon from "../../components/Icon";

const CATEGORIES = [
  "Настольные игры",
  "Спорт",
  "Культура",
  "Кино",
  "Прогулка",
  "Музыка",
  "Волонтёрство",
  "Другое",
];

export default function EventBasicsFields({
  formData,
  errors,
  setField,
  setFormat,
}) {
  return (
    <>
      <div className="form-group">
        <label>Название события</label>
        <div className={`input-with-icon ${errors.title ? "error" : ""}`}>
          <span className="input-icon">
            <Icon name="edit" size={21} />
          </span>
          <input
            value={formData.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Например, вечер настолок в «Смене»"
          />
        </div>
        {errors.title && <p className="error-text">{errors.title}</p>}
      </div>

      <div className="form-group">
        <label>Категория</label>
        <div
          className={`input-with-icon select-wrapper ${errors.category ? "error" : ""}`}
        >
          <span className="input-icon">
            <Icon name="grid" size={21} />
          </span>
          <select
            value={formData.category}
            onChange={(event) => setField("category", event.target.value)}
          >
            <option value="">Выберите категорию</option>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <Icon name="chevronDown" className="select-chevron" size={18} />
        </div>
        {errors.category && <p className="error-text">{errors.category}</p>}
      </div>

      <div className="form-group">
        <label>Дата и время</label>
        <div className="form-row-2">
          <div className={`input-with-icon ${errors.date ? "error" : ""}`}>
            <span className="input-icon">
              <Icon name="calendar" size={21} />
            </span>
            <input
              type="date"
              value={formData.date}
              onChange={(event) => setField("date", event.target.value)}
            />
          </div>
          <div className={`input-with-icon ${errors.time ? "error" : ""}`}>
            <span className="input-icon">
              <Icon name="clock" size={21} />
            </span>
            <input
              type="time"
              value={formData.time}
              onChange={(event) => setField("time", event.target.value)}
            />
          </div>
        </div>
        {(errors.date || errors.time) && (
          <p className="error-text">{errors.date || errors.time}</p>
        )}
      </div>

      <div className="form-group">
        <label>Продолжительность</label>
        <div className="form-row-2">
          <div className={`input-with-icon ${errors.duration ? "error" : ""}`}>
            <span className="input-icon">
              <Icon name="clock" size={21} />
            </span>
            <input
              type="number"
              min="0"
              max="72"
              value={formData.durationHours}
              onChange={(event) =>
                setField("durationHours", event.target.value)
              }
              placeholder="Часы"
            />
          </div>
          <div className={`input-with-icon ${errors.duration ? "error" : ""}`}>
            <span className="input-icon">
              <Icon name="clock" size={21} />
            </span>
            <input
              type="number"
              min="0"
              max="59"
              value={formData.durationMinutes}
              onChange={(event) =>
                setField("durationMinutes", event.target.value)
              }
              placeholder="Минуты"
            />
          </div>
        </div>
        {errors.duration && <p className="error-text">{errors.duration}</p>}
        <p className="hint-text-with-icon">
          Укажите, сколько будет длиться событие. Например, для фильма — 2 ч 15
          мин.
        </p>
      </div>

      <div className="form-group">
        <label>Формат</label>
        <div className="format-segmented">
          <button
            type="button"
            className={formData.format === "Офлайн" ? "active" : ""}
            onClick={() => setFormat("Офлайн")}
          >
            <Icon name="people" size={21} />
            Офлайн
          </button>
          <button
            type="button"
            className={formData.format === "Онлайн" ? "active" : ""}
            onClick={() => setFormat("Онлайн")}
          >
            <Icon name="monitor" size={21} />
            Онлайн
          </button>
        </div>
      </div>
    </>
  );
}
