import { useEffect, useMemo, useState } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

const markerColor = {
  "Настольные игры": "blue",
  Спорт: "green",
  Культура: "pink",
  Кино: "orange",
  Музыка: "violet",
  Прогулка: "blue",
};

const categorySvg = {
  "Настольные игры":
    '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></svg>',
  Спорт:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="m7 8 10 8M8 17l8-10M5 12h14"/></svg>',
  Культура:
    '<svg viewBox="0 0 24 24"><path d="m4 9 8-5 8 5M6 10v7M10 10v7M14 10v7M18 10v7M4 20h16"/></svg>',
  Кино: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="13" rx="2"/><path d="m10 10 5 3-5 3Z"/></svg>',
  Музыка:
    '<svg viewBox="0 0 24 24"><path d="M9 17V6l10-2v11M9 17a3 3 0 1 1-3-3h3M19 15a3 3 0 1 1-3-3h3"/></svg>',
  Прогулка:
    '<svg viewBox="0 0 24 24"><circle cx="13" cy="5" r="2"/><path d="m11 9 3 3 3 1M11 9 8 13M14 12l-1 7M10 14l-3 5"/></svg>',
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function renderFriendAvatar(friend) {
  const rawName = String(friend?.name || "").trim();
  const safeName = escapeHtml(rawName || "Друг");
  const initial = escapeHtml((rawName || "Д").slice(0, 1).toUpperCase());
  const photoUrl =
    typeof friend?.photo_url === "string" ? friend.photo_url.trim() : "";

  if (photoUrl) {
    return `<span class="marker-friend" title="${safeName}">
      <img src="${escapeHtml(photoUrl)}" alt="" onerror="this.style.display='none'; this.parentElement.classList.add('marker-friend--fallback');"/>
      <span class="marker-friend-initial">${initial}</span>
    </span>`;
  }

  return `<span class="marker-friend marker-friend--fallback" title="${safeName}">
    <span class="marker-friend-initial">${initial}</span>
  </span>`;
}

function buildMarkerSymbolHtml(friend, categorySvgHtml) {
  if (!friend) {
    return `<span class="marker-symbol">${categorySvgHtml}</span>`;
  }
  return `<span class="marker-symbol marker-symbol--friends">${renderFriendAvatar(friend)}</span>`;
}

function useFriendRotation(geoEvents, intervalMs = 7000) {
  const [tick, setTick] = useState(0);
  const hasMultiFriends = useMemo(
    () =>
      geoEvents.some(
        (event) =>
          Array.isArray(event.friendGoers) && event.friendGoers.length > 1,
      ),
    [geoEvents],
  );

  useEffect(() => {
    if (!hasMultiFriends) return undefined;
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [hasMultiFriends, intervalMs]);

  return tick;
}

export default function EventMarkers({ events, onEventClick }) {
  const rotationTick = useFriendRotation(events);
  const icons = useMemo(
    () =>
      Object.fromEntries(
        events.map((event) => {
          const friends = Array.isArray(event.friendGoers)
            ? event.friendGoers.filter(Boolean)
            : [];
          const activeFriend = friends.length
            ? friends[rotationTick % friends.length]
            : null;
          const symbolHtml = buildMarkerSymbolHtml(
            activeFriend,
            categorySvg[event.category] || categorySvg["Прогулка"],
          );
          const participantLabel = `${event.participants} участников`;
          const hasFriends = friends.length > 0;
          const friendsLabel = hasFriends
            ? `<small class="event-map-marker-friends-label">Друг идёт${
                friends.length > 1 ? ` · ${friends.length}` : ""
              }</small>`
            : "";

          return [
            event.id,
            L.divIcon({
              className: "event-map-marker-wrap",
              html: `<div class="event-map-marker ${
                markerColor[event.category] || "blue"
              }${hasFriends ? " event-map-marker--has-friends" : ""}">
                ${symbolHtml}
                <span>
                  <b>${escapeHtml(event.category)}</b>
                  <small>${escapeHtml(participantLabel)}</small>
                  ${friendsLabel}
                </span>
              </div>`,
              iconSize: [190, 60],
              iconAnchor: [26, 56],
            }),
          ];
        }),
      ),
    [events, rotationTick],
  );

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={80}
      showCoverageOnHover={false}
      spiderfyOnMaxZoom
      disableClusteringAtZoom={13}
    >
      {events.map((event) => (
        <Marker
          key={`${event.id}-${
            Array.isArray(event.friendGoers) && event.friendGoers.length > 1
              ? rotationTick % event.friendGoers.length
              : 0
          }`}
          position={[event.lat, event.lng]}
          icon={icons[event.id]}
          eventHandlers={{ click: () => onEventClick(event) }}
        />
      ))}
    </MarkerClusterGroup>
  );
}
