import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import Icon from "../../components/Icon";
import styles from "./EventLocationMap.module.css";

export default function EventLocationMap({ event }) {
  if (event.format === "Онлайн" || event.district === "Онлайн") return null;
  if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
    return <p className={styles.unavailable}>Место на карте не указано</p>;
  }
  const position = [event.lat, event.lng];
  const yandexUrl = `https://yandex.ru/maps/?rtext=~${event.lat}%2C${event.lng}`;
  // 2GIS expects longitude,latitude; an empty first point means current location.
  const twoGisUrl = `https://2gis.ru/directions/points/|${event.lng},${event.lat}`;
  return (
    <div className={styles.map}>
      <MapContainer
        key={`${event.id}-${position.join(",")}`}
        center={position}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        keyboard={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={position}
          radius={7}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: "#4b5563",
            fillOpacity: 1,
          }}
        />
      </MapContainer>
      <details className={styles.openControls}>
        <summary>
          <Icon name="compass" size={17} />
          Открыть в картах
        </summary>
        <div className={styles.providerMenu}>
          <a href={yandexUrl} target="_blank" rel="noopener noreferrer">
            Яндекс Карты
          </a>
          <a href={twoGisUrl} target="_blank" rel="noopener noreferrer">
            2ГИС
          </a>
        </div>
      </details>
    </div>
  );
}
