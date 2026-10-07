import Icon from "../../components/Icon";
import { getLocalDate, INTERESTS } from "./planModel.js";

export default function TouristPlanForm({
  city,
  onCityChange,
  date,
  onDateChange,
  days,
  onDaysChange,
  interests,
  onToggleInterest,
  budget,
  onBudgetChange,
  maxDistanceKm,
  onMaxDistanceChange,
  query,
  onQueryChange,
  hasUserCoords,
  userCoords,
  loading,
  isGuestMode,
  hasPlan,
  onSubmit,
  onTouch,
}) {
  return (
    <form
      className="tourist-plan-form"
      onSubmit={onSubmit}
      onChangeCapture={onTouch}
      onClickCapture={onTouch}
    >
      <div className="tourist-plan-fields-row">
        <label className="tourist-plan-field tourist-plan-field-city">
          Город
          <input
            required
            maxLength={80}
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            autoComplete="address-level2"
          />
        </label>
        <label className="tourist-plan-field">
          Начало поездки
          <input
            required
            type="date"
            min={getLocalDate()}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>
        <label className="tourist-plan-field">
          Дней в городе
          <input
            required
            type="number"
            min="1"
            max="7"
            value={days}
            onChange={(event) =>
              onDaysChange(
                event.target.value === ""
                  ? ""
                  : Math.max(1, Math.min(7, Number(event.target.value))),
              )
            }
          />
        </label>
      </div>

      <fieldset className="tourist-plan-interests">
        <legend>Интересы</legend>
        <div>
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              className={`tourist-plan-interest ${interests.includes(interest) ? "active" : ""}`}
              aria-pressed={interests.includes(interest)}
              onClick={() => onToggleInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="tourist-plan-fields tourist-plan-preferences">
        <fieldset>
          <legend>Бюджет</legend>
          <div className="tourist-plan-choice-row">
            <button
              type="button"
              className={budget === "free" ? "active" : ""}
              aria-pressed={budget === "free"}
              onClick={() => onBudgetChange("free")}
            >
              Бесплатные
            </button>
            <button
              type="button"
              className={budget === "any" ? "active" : ""}
              aria-pressed={budget === "any"}
              onClick={() => onBudgetChange("any")}
            >
              Любые
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>Радиус от центра</legend>
          <div className="tourist-plan-choice-row">
            {[3, 5, 10].map((radius) => (
              <button
                key={radius}
                type="button"
                className={Number(maxDistanceKm) === radius ? "active" : ""}
                aria-pressed={Number(maxDistanceKm) === radius}
                onClick={() => onMaxDistanceChange(radius)}
              >
                {radius} км
              </button>
            ))}
            <button
              type="button"
              className={!maxDistanceKm ? "active" : ""}
              aria-pressed={!maxDistanceKm}
              onClick={() => onMaxDistanceChange(null)}
            >
              Любой
            </button>
          </div>
        </fieldset>
      </div>

      <label className="tourist-plan-query">
        Дополнительные пожелания
        <textarea
          maxLength={500}
          rows={3}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Например: начать после 11, спокойный темп"
        />
      </label>
      <p className="tourist-plan-privacy">
        Учитываются интересы, длительность, бюджет и расстояние. Запрос и встречи
        передаются AI-провайдеру.
      </p>
      <p className="tourist-plan-privacy">
        {hasUserCoords
          ? `Маршрут строится от вашего текущего местоположения: ${Number(userCoords.lat).toFixed(4)}, ${Number(userCoords.lng).toFixed(4)}`
          : "Разрешите доступ к геолокации в браузере, чтобы строить маршрут от вашего местоположения. Сейчас — от центра города."}
      </p>
      <button className="tourist-plan-submit" type="submit" disabled={loading}>
        <Icon name="compass" size={19} />
        {loading
          ? "Составляем варианты…"
          : isGuestMode
            ? "Войдите в MAX, чтобы составить маршрут"
            : hasPlan
              ? "Обновить варианты"
              : "Составить варианты"}
      </button>
    </form>
  );
}
