import { useState } from "react";
import { useStore } from "../../store/StoreProvider.jsx";

export function useTouristPlaceEditor({ selectedOption, addCustomStop }) {
  const store = useStore();
  const [placesKind, setPlacesKind] = useState("both");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placesError, setPlacesError] = useState("");
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [textPlaceSuggestions, setTextPlaceSuggestions] = useState([]);
  const [placeSearchError, setPlaceSearchError] = useState("");
  const [manualStopName, setManualStopName] = useState("");
  const [manualDuration, setManualDuration] = useState(45);
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualPoint, setManualPoint] = useState(null);
  const [manualAddressResults, setManualAddressResults] = useState([]);
  const [manualAddressLoading, setManualAddressLoading] = useState(false);
  const [manualMapOpen, setManualMapOpen] = useState(false);
  const [manualStopError, setManualStopError] = useState("");

  const findPlaces = async () => {
    const eventIds = selectedOption?.events.map((event) => event.id) || [];
    if (!eventIds.length) return;
    setPlacesLoading(true);
    setPlacesError("");
    try {
      const result = await store.tourist.recommendPlaces({
        eventIds,
        kind: placesKind,
      });
      setPlaceSuggestions(result.places || []);
      if (!result.places?.length) {
        setPlacesError("Рядом с событиями не нашлось подходящих мест.");
      }
    } catch (requestError) {
      setPlacesError(
        /404|not found/i.test(requestError.message)
          ? "Этот endpoint отсутствует на текущем backend. Переключи VITE_API_URL на новый Amvera API и задеплой server."
          : requestError.message ||
              "Не удалось загрузить места поблизости.",
      );
    } finally {
      setPlacesLoading(false);
    }
  };

  const searchPlacesByText = async (event) => {
    event.preventDefault();
    if (!placeSearchQuery.trim() || !selectedOption?.events.length) return;
    setPlaceSearchLoading(true);
    setPlaceSearchError("");
    try {
      const result = await store.tourist.searchPlaces({
        eventIds: selectedOption.events.map((item) => item.id),
        query: placeSearchQuery.trim(),
      });
      setTextPlaceSuggestions(result.places || []);
      if (!result.places?.length) {
        setPlaceSearchError(
          "Рядом с маршрутом ничего не найдено. Попробуй другое название.",
        );
      }
    } catch (requestError) {
      setPlaceSearchError(
        /404|not found/i.test(requestError.message)
          ? "Текстовый поиск ещё не развернут на backend. Проверь VITE_API_URL и обнови server на Amvera."
          : requestError.message ||
              "Не удалось выполнить поиск. Обнови backend Amvera.",
      );
    } finally {
      setPlaceSearchLoading(false);
    }
  };

  const searchManualAddress = async (event) => {
    event.preventDefault();
    if (manualAddress.trim().length < 3) return;
    setManualAddressLoading(true);
    setManualStopError("");
    try {
      const result = await store.tourist.geocodeAddress(manualAddress.trim());
      setManualAddressResults(result.addresses || []);
      if (!result.addresses?.length) {
        setManualStopError(
          "Адрес не найден. Можно поставить точку на карте.",
        );
      }
    } catch (requestError) {
      setManualStopError(
        /404|not found/i.test(requestError.message)
          ? "Поиск адреса ещё не развернут на backend. Можно выбрать точку на карте."
          : requestError.message ||
              "Не удалось найти адрес. Можно выбрать точку на карте.",
      );
    } finally {
      setManualAddressLoading(false);
    }
  };

  const selectManualPoint = async (point) => {
    setManualPoint(point);
    setManualStopError("");
    try {
      const location = await store.tourist.reverseGeocode(
        point.lat,
        point.lng,
      );
      const address = [location.street, location.district, location.city]
        .filter(Boolean)
        .join(", ");
      if (address) setManualAddress(address);
    } catch {
      // Coordinates are still enough to add the stop.
    }
  };

  const submitManualStop = (event) => {
    event.preventDefault();
    if (!manualStopName.trim() || !manualPoint) {
      setManualStopError(
        "Укажи название и выбери адрес или точку на карте.",
      );
      return;
    }
    addCustomStop({
      name: manualStopName.trim(),
      address: manualAddress.trim(),
      lat: Number(manualPoint.lat),
      lng: Number(manualPoint.lng),
      durationMinutes: manualDuration,
      startTime: manualStartTime || null,
    });
    setManualStopName("");
    setManualDuration(45);
    setManualStartTime("");
    setManualAddress("");
    setManualPoint(null);
    setManualAddressResults([]);
    setManualStopError("");
    setManualMapOpen(false);
  };

  const handleManualAddressChange = (value) => {
    setManualAddress(value);
    setManualPoint(null);
    setManualAddressResults([]);
  };

  const selectManualAddress = (address) => {
    setManualPoint({ lat: address.lat, lng: address.lng });
    setManualAddress(address.label);
    setManualAddressResults([]);
  };

  return {
    placesKind,
    setPlacesKind,
    placeSuggestions,
    placesError,
    placesLoading,
    findPlaces,
    placeSearchQuery,
    setPlaceSearchQuery,
    placeSearchLoading,
    textPlaceSuggestions,
    placeSearchError,
    searchPlacesByText,
    manualStopName,
    setManualStopName,
    manualDuration,
    setManualDuration,
    manualStartTime,
    setManualStartTime,
    manualAddress,
    handleManualAddressChange,
    manualPoint,
    manualAddressResults,
    manualAddressLoading,
    searchManualAddress,
    selectManualAddress,
    manualMapOpen,
    setManualMapOpen,
    manualStopError,
    selectManualPoint,
    submitManualStop,
  };
}
