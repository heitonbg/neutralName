import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import EventCard from "../../components/EventCard.jsx";
import EventMapControls from "./EventMapControls.jsx";
import EventMarkers from "./EventMarkers.jsx";
import TouristRouteOverlay from "./TouristRouteOverlay.jsx";
import styles from "./EventMap.module.css";
import markerStyles from "./EventMarkers.module.css";
import { isEventOwner } from "../../utils/eventOwnership";
import { isOnlineEvent } from "../../utils/eventFilters";
import {
  getTouristRouteStops,
  isTouristPlace,
} from "../../utils/touristMapLinks";

const DEFAULT_CENTER = [55.796, 49.108];

function MapEffects({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);
  return null;
}

const EventMap = ({
  events,
  timeFilter = "all",
  onTimeFilterChange,
  touristRoute,
  onCloseTouristRoute,
  onJoin,
  onLeave,
  onLeaveRequest,
  onDelete,
  userId,
  onEventClick,
  joinedIds = [],
  likedIds = [],
  onToggleLike,
  city = "Казань",
  cityCoords,
  userCoords,
  showUserMarker = false,
}) => {
  const [activeEvent, setActiveEvent] = useState(null);
  const [touristRoadStatus, setTouristRoadStatus] = useState({
    loading: false,
    error: "",
  });
  const mapRef = useRef(null);

  const geoEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          !isOnlineEvent(event) &&
          event.lat != null &&
          event.lng != null &&
          Number.isFinite(Number(event.lat)) &&
          Number.isFinite(Number(event.lng)),
      ),
    [events],
  );

  const touristOption =
    touristRoute?.options?.find(
      (option) => option.id === touristRoute.selectedOptionId,
    ) || touristRoute?.options?.[0];
  const touristRouteStops = useMemo(
    () => (touristOption ? getTouristRouteStops(touristOption) : []),
    [touristOption],
  );
  const touristRoutePoints = useMemo(
    () =>
      touristRouteStops.filter(
        (stop) =>
          !isOnlineEvent(stop) &&
          stop.lat != null &&
          stop.lng != null &&
          Number.isFinite(Number(stop.lat)) &&
          Number.isFinite(Number(stop.lng)),
      ),
    [touristRouteStops],
  );
  const touristEventIds = useMemo(
    () =>
      new Set(
        touristRouteStops
          .filter((stop) => !isTouristPlace(stop) && !isOnlineEvent(stop))
          .map((event) => String(event.id)),
      ),
    [touristRouteStops],
  );
  const isTouristRouteVisible = Boolean(
    touristRoute && touristRoutePoints.length,
  );

  useEffect(() => {
    if (!activeEvent) return;
    const updated = isTouristRouteVisible
      ? touristRouteStops.find(
          (event) =>
            !isTouristPlace(event) &&
            String(event.id) === String(activeEvent.id),
        )
      : events.find((event) => String(event.id) === String(activeEvent.id));
    if (!updated || isOnlineEvent(updated)) {
      setActiveEvent(null);
      return;
    }
    if (updated !== activeEvent) setActiveEvent(updated);
  }, [activeEvent, events, isTouristRouteVisible, touristRouteStops]);

  const handleLocate = () => {
    if (!mapRef.current || !userCoords) return;
    mapRef.current.flyTo([userCoords.lat, userCoords.lng], 14, {
      duration: 0.8,
    });
  };

  const hasUserMarker =
    showUserMarker &&
    userCoords?.lat != null &&
    userCoords?.lng != null &&
    Number.isFinite(Number(userCoords.lat)) &&
    Number.isFinite(Number(userCoords.lng));

  return (
    <div className={`map-container ${styles.mapScreen} ${markerStyles.scope}`}>
      <MapContainer
        key={city}
        center={cityCoords || DEFAULT_CENTER}
        zoom={10}
        zoomControl={false}
        scrollWheelZoom
        minZoom={3}
        worldCopyJump
      >
        <MapEffects
          onMapReady={(map) => {
            mapRef.current = map;
          }}
        />
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TouristRouteOverlay
          active={isTouristRouteVisible}
          stops={touristRouteStops}
          onStatus={setTouristRoadStatus}
          onEventClick={setActiveEvent}
        />

        {hasUserMarker && (
          <CircleMarker
            center={[Number(userCoords.lat), Number(userCoords.lng)]}
            radius={9}
            pathOptions={{
              color: "#fff",
              weight: 3,
              fillColor: "#2786f8",
              fillOpacity: 1,
            }}
          >
            <Popup>Вы здесь</Popup>
          </CircleMarker>
        )}

        {!isTouristRouteVisible && (
          <EventMarkers events={geoEvents} onEventClick={setActiveEvent} />
        )}
      </MapContainer>

      <EventMapControls
        timeFilter={timeFilter}
        onTimeFilterChange={onTimeFilterChange}
        userCoords={userCoords}
        onLocate={handleLocate}
        touristRoute={touristRoute}
        touristRoutePoints={isTouristRouteVisible ? touristRoutePoints : []}
        touristRoadStatus={touristRoadStatus}
        onCloseTouristRoute={onCloseTouristRoute}
      />

      {activeEvent &&
        !isOnlineEvent(activeEvent) &&
        (!isTouristRouteVisible ||
          touristEventIds.has(String(activeEvent.id))) && (
          <div className={styles.mapPreview}>
            <EventCard
              event={activeEvent}
              isOwner={isEventOwner(activeEvent, userId)}
              onDelete={onDelete}
              onJoin={onJoin}
              onLeave={onLeave}
              onLeaveRequest={onLeaveRequest}
              onClick={onEventClick}
              isJoined={joinedIds.includes(activeEvent.id)}
              isLiked={likedIds.includes(activeEvent.id)}
              onToggleLike={onToggleLike}
              onClosePreview={() => setActiveEvent(null)}
            />
          </div>
        )}
    </div>
  );
};

export default EventMap;
