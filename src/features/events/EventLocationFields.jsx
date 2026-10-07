import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Icon from '../../components/Icon';
import styles from './EventLocationFields.module.css';

const pickerPin = L.divIcon({
  className: styles.pickerPinWrap,
  html: `<div class="${styles.pickerPinDot}"></div>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38]
});

function PointSelector({ point, onSelect }) {
  useMapEvents({ click: (event) => onSelect(event.latlng) });
  return point ? <Marker position={[point.lat, point.lng]} icon={pickerPin} /> : null;
}

function EventLocationFields({
  formData,
  errors,
  showSuggestions,
  setShowSuggestions,
  addressSuggestions,
  addressSearchLoading,
  addressSearchError,
  handleAddressChange,
  chooseSuggestion,
  setDraftPoint,
  showMapPicker,
  setShowMapPicker,
  draftPoint,
  center,
  handleMapPointSelect,
  detectedCity,
  confirmPoint
}) {
  return (
    <div className="form-group">
      <label>Место проведения</label>
      <div className={`${styles.addressControl} input-with-icon ${errors.address ? 'error' : ''}`}>
        <span className="input-icon"><Icon name="pin" size={21} /></span>
        <input
          value={formData.address}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          onChange={(event) => handleAddressChange(event.target.value)}
          placeholder="Введите адрес, место или заведение"
        />
        {showSuggestions && (
          <div className={styles.addressSuggestions}>
            {addressSuggestions.map((item) => (
              <button
                type="button"
                key={`${item.lat},${item.lng}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  chooseSuggestion(item);
                }}
              >
                <Icon name="pin" size={17} />
                <span>{item.label}</span>
              </button>
            ))}
            {addressSearchLoading && <p className={styles.searchStatus}>Ищем адрес…</p>}
            {!addressSearchLoading && addressSearchError && (
              <p className={`${styles.searchStatus} ${styles.searchStatusError}`}>{addressSearchError}</p>
            )}
            {!addressSearchLoading && !addressSearchError && formData.address.trim().length >= 3 && !addressSuggestions.length && (
              <p className={styles.searchStatus}>Ничего не найдено. Попробуйте уточнить запрос или укажите точку на карте.</p>
            )}
          </div>
        )}
      </div>
      {errors.address && <p className="error-text">{errors.address}</p>}

      <button
        type="button"
        className={`map-picker-btn ${styles.mapPickerFull}`}
        onClick={() => {
          setDraftPoint((point) => point || {
            lat: formData.lat ?? center.lat,
            lng: formData.lng ?? center.lng,
          });
          setShowMapPicker((value) => !value);
        }}
      >
        <Icon name="map" size={21} />{showMapPicker ? 'Скрыть карту' : 'Указать на карте'}
      </button>

      {showMapPicker && (
        <div className={styles.inlineLocationPicker}>
          <div className={styles.pickerMap}>
            <MapContainer
              key={`${draftPoint?.lat || formData.lat}-${draftPoint?.lng || formData.lng}`}
              center={[
                draftPoint?.lat ?? formData.lat ?? center.lat,
                draftPoint?.lng ?? formData.lng ?? center.lng,
              ]}
              zoom={14}
              scrollWheelZoom
            >
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <PointSelector point={draftPoint} onSelect={handleMapPointSelect} />
            </MapContainer>
          </div>

          {detectedCity && (
            <p className="hint-text-with-icon" style={{ color: '#2786f8', fontWeight: 600 }}>
              <Icon name="pin" size={16} filled /> Определён город: {detectedCity.name}
              {detectedCity.regionName ? `, ${detectedCity.regionName}` : ''}
            </p>
          )}

          <button type="button" className={styles.confirmMapPoint} disabled={!draftPoint} onClick={confirmPoint}>
            Готово, сохранить точку
          </button>
        </div>
      )}
      <p className="hint-text-with-icon">Введите место и выберите адрес из результатов поиска или отметьте точку на карте.</p>
    </div>
  );
}

export default EventLocationFields;
