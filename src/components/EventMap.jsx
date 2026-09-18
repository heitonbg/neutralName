import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Иконки маркеров
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Кастомная иконка для кластера
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="cluster-marker"><span>${count}</span></div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(44, 44, true)
  });
};

const EventMap = ({ events, onJoin }) => {
  const center = [55.796, 49.108]; // Казань

  const geoEvents = events.filter((e) => e.lat && e.lng);

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={12} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
          {geoEvents.map((event) => (
            <Marker key={event.id} position={[event.lat, event.lng]}>
              <Popup>
                <div className="map-popup">
                  <img src={event.image} alt={event.title} />
                  <h4>{event.title}</h4>
                  <p>{event.date}</p>
                  <p className="map-popup-location">📍 {event.district}</p>
                  <button onClick={() => onJoin(event)}>Присоединиться</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default EventMap;