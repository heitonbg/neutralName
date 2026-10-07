import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import { fetchFootRoute } from "../../utils/roadRoute";
import { isOnlineEvent } from "../../utils/eventFilters";
import { isTouristPlace } from "../../utils/touristMapLinks";
import styles from "./EventMap.module.css";

export default function TouristRouteOverlay({
  active,
  stops,
  onStatus,
  onEventClick,
}) {
  const map = useMap();
  const previousViewRef = useRef(null);
  const [roadRoute, setRoadRoute] = useState(null);

  const points = useMemo(
    () =>
      stops.filter(
        (stop) =>
          !isOnlineEvent(stop) &&
          stop.lat != null &&
          stop.lng != null &&
          Number.isFinite(Number(stop.lat)) &&
          Number.isFinite(Number(stop.lng)),
      ),
    [stops],
  );

  useEffect(() => {
    if (!active || points.length < 2) {
      setRoadRoute(null);
      onStatus?.({ loading: false, error: "" });
      return undefined;
    }

    const controller = new AbortController();
    setRoadRoute(null);
    onStatus?.({ loading: true, error: "" });
    fetchFootRoute(points, { signal: controller.signal })
      .then((route) => {
        if (controller.signal.aborted) return;
        setRoadRoute(route);
        onStatus?.({
          loading: false,
          error: "",
          distanceMeters: route?.distanceMeters,
          durationSeconds: route?.durationSeconds,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        onStatus?.({
          loading: false,
          error: error.message || "Не удалось построить пеший маршрут",
        });
      });

    return () => controller.abort();
  }, [active, points, onStatus]);

  useEffect(() => {
    if (active && points.length) {
      if (!previousViewRef.current) {
        previousViewRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom(),
        };
      }
      const positions =
        roadRoute?.coordinates ||
        points.map((point) => [Number(point.lat), Number(point.lng)]);
      if (positions.length > 1) {
        map.fitBounds(positions, { padding: [48, 48], maxZoom: 14 });
      } else {
        map.setView(positions[0], 14);
      }
      return;
    }

    if (previousViewRef.current) {
      map.setView(previousViewRef.current.center, previousViewRef.current.zoom);
      previousViewRef.current = null;
    }
  }, [active, map, points, roadRoute]);

  if (!active || !points.length) return null;
  const positions = points.map((point) => [
    Number(point.lat),
    Number(point.lng),
  ]);

  return (
    <>
      {roadRoute?.coordinates?.length > 1 && (
        <Polyline
          positions={roadRoute.coordinates}
          pathOptions={{ color: "#177a56", weight: 5, opacity: 0.9 }}
        />
      )}
      {points.map((point, index) => {
        const isPlace = isTouristPlace(point);
        return (
          <CircleMarker
            key={`${point.id || point.eventId}-${index}`}
            center={positions[index]}
            radius={11}
            pathOptions={{
              color: "#fff",
              fillColor: isPlace ? "#c07820" : "#177a56",
              fillOpacity: 1,
              weight: 3,
            }}
            eventHandlers={
              !isPlace ? { click: () => onEventClick?.(point) } : undefined
            }
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -8]}
              className={styles.touristRouteStopNumber}
            >
              {index + 1}
            </Tooltip>
            {isPlace && (
              <Popup>{`${index + 1}. ${point.name || point.title}`}</Popup>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
}
