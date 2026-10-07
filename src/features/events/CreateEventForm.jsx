import { useState } from "react";
import { useStore } from "../../store/StoreProvider";
import Icon from "../../components/Icon";
import EventBasicsFields from "./EventBasicsFields";
import EventDetailsFields from "./EventDetailsFields";
import EventLocationFields from "./EventLocationFields";
import EventImageFields from "./EventImageFields";
import { useEventLocationEditor } from "./useEventLocationEditor.js";
import {
  buildEventPayload,
  parseEventDuration,
  splitEventDateTime,
  validateEventForm,
} from "./eventFormModel.js";
import styles from "./EventFormFields.module.css";
import themeStyles from "./EventFormTheme.module.css";
import responsiveStyles from "./EventFormResponsive.module.css";

const CITY_CENTERS = {
  Казань: { lat: 55.796, lng: 49.108 },
  Москва: { lat: 55.7558, lng: 37.6176 },
  "Санкт-Петербург": { lat: 59.9343, lng: 30.3351 },
};
const DEFAULT_CENTER = { lat: 55.796, lng: 49.108 };

const CreateEventForm = ({
  onCreate,
  onCancel,
  userId,
  userName,
  userPhotoUrl,
  userAge,
  userCity,
  userAbout,
  city = "Казань",
  cityCoords,
  initialEvent = null,
}) => {
  const store = useStore();
  const center = cityCoords || CITY_CENTERS[city] || DEFAULT_CENTER;

  const isEdit = Boolean(initialEvent);
  const dt = splitEventDateTime(initialEvent);
  const durationParsed = parseEventDuration(initialEvent?.duration);

  const initialFormat =
    initialEvent?.format ||
    (initialEvent?.district === "Онлайн" ? "Онлайн" : "Офлайн");
  const isOnlineInitially = initialFormat === "Онлайн";

  const [formData, setFormData] = useState({
    title: initialEvent?.title || "",
    category: initialEvent?.category || "",
    date: dt.date,
    time: dt.time,
    durationHours: durationParsed.hours,
    durationMinutes: durationParsed.minutes,
    format: initialFormat,
    price: initialEvent?.price || "Бесплатно",
    priceAmount:
      initialEvent?.priceAmount != null ? String(initialEvent.priceAmount) : "",
    address: /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(
      initialEvent?.address || "",
    )
      ? `${initialEvent?.city || city}, место на карте`
      : isOnlineInitially
        ? ""
        : initialEvent?.address || "",
    district: isOnlineInitially ? "" : initialEvent?.district || "",
    city: isOnlineInitially ? "" : initialEvent?.city || city,
    limit: initialEvent?.maxParticipants
      ? String(initialEvent.maxParticipants)
      : "",
    maxChatUrl: initialEvent?.maxChatUrl || "",
    description: initialEvent?.description || "",
    images:
      initialEvent?.images || (initialEvent?.image ? [initialEvent.image] : []),
    lat: isOnlineInitially ? null : (initialEvent?.lat ?? null),
    lng: isOnlineInitially ? null : (initialEvent?.lng ?? null),
  });

  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  // ★ Для нового офлайн-события галочка по умолчанию не стоит.
  //   Для онлайн — не важна, проверим только когда format === 'Офлайн'.
  const [publicPlaceConfirmed, setPublicPlaceConfirmed] = useState(
    isEdit ? !isOnlineInitially : false,
  );
  const [submitting, setSubmitting] = useState(false);
  const locationEditor = useEventLocationEditor({
    store,
    city,
    formData,
    setFormData,
    setErrors,
  });

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const setFormat = (nextFormat) => {
    setFormData((prev) => {
      if (nextFormat === "Онлайн") {
        return {
          ...prev,
          format: "Онлайн",
          address: "",
          district: "",
          city: "",
          lat: null,
          lng: null,
        };
      }
      return {
        ...prev,
        format: "Офлайн",
        lat: prev.lat ?? null,
        lng: prev.lng ?? null,
        city: prev.city || city,
      };
    });

    // ★ При уходе в онлайн «подтверждаем» галочку — она не нужна.
    //   Если потом вернёмся в офлайн, пользователь её проставит заново.
    if (nextFormat === "Онлайн") {
      setPublicPlaceConfirmed(true);
    } else {
      setPublicPlaceConfirmed(false);
    }

    // Сбрасываем ошибку «publicPlace», чтобы она не висела на скрытом поле.
    setErrors((prev) => {
      if (!prev.publicPlace) return prev;
      const next = { ...prev };
      delete next.publicPlace;
      return next;
    });

    locationEditor.setDraftPoint(null);
    locationEditor.setDetectedCity(null);
    locationEditor.setShowMapPicker(false);
    locationEditor.setShowSuggestions(false);
  };

  const chooseImage = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setErrors((prev) => ({ ...prev, image: "Выберите файл изображения" }));
      return;
    }
    setNewFiles((prev) =>
      [...prev, ...files].slice(0, Math.max(0, 5 - formData.images.length)),
    );
    setErrors((prev) => ({ ...prev, image: null }));
    event.target.value = "";
  };

  const removeImage = (index) => {
    if (index < formData.images.length) {
      setField(
        "images",
        formData.images.filter((_, i) => i !== index),
      );
    } else {
      const fileIndex = index - formData.images.length;
      setNewFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const validate = () => {
    const nextErrors = validateEventForm(formData, publicPlaceConfirmed);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let uploadedUrls = [];
      if (newFiles.length) {
        uploadedUrls = await store.events.uploadImages(newFiles);
      }
      const preservedImages = formData.images.filter(
        (img) => typeof img === "string" && !img.startsWith("blob:"),
      );
      const finalImages = [...preservedImages, ...uploadedUrls].filter(Boolean);
      const payload = buildEventPayload({
        formData,
        images: finalImages,
        userId,
        userName,
        userPhotoUrl,
        userAge,
        userCity,
        userAbout,
        defaultCity: city,
        initialEvent,
      });

      await onCreate(payload, initialEvent?.id);
    } catch (error) {
      setErrors({ submit: error.message || "Не удалось сохранить событие" });
    } finally {
      setSubmitting(false);
    }
  };

  const allImages = [
    ...formData.images.map((src, i) => ({ src, index: i })),
    ...newFiles.map((file, i) => ({
      src: URL.createObjectURL(file),
      index: formData.images.length + i,
    })),
  ];

  const isOnline = formData.format === "Онлайн";

  return (
    <div
      className={`create-form-v2 ${styles.formScope} ${themeStyles.formScope} ${responsiveStyles.formScope}`}
    >
      <div className="create-header">
        <button className="back-btn" onClick={onCancel} aria-label="Назад">
          <Icon name="arrowLeft" size={23} />
        </button>
        <div>
          <h1>{isEdit ? "Редактировать событие" : "Создать событие"}</h1>
          <p className="create-subtitle">
            Делитесь идеями. Собирайте людей. Делайте город ярче.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <EventBasicsFields
          formData={formData}
          errors={errors}
          setField={setField}
          setFormat={setFormat}
        />

        {!isOnline && (
          <EventLocationFields
            formData={formData}
            errors={errors}
            showSuggestions={locationEditor.showSuggestions}
            setShowSuggestions={locationEditor.setShowSuggestions}
            addressSuggestions={locationEditor.addressSuggestions}
            addressSearchLoading={locationEditor.addressSearchLoading}
            addressSearchError={locationEditor.addressSearchError}
            handleAddressChange={locationEditor.handleAddressChange}
            chooseSuggestion={locationEditor.chooseSuggestion}
            setDraftPoint={locationEditor.setDraftPoint}
            showMapPicker={locationEditor.showMapPicker}
            setShowMapPicker={locationEditor.setShowMapPicker}
            draftPoint={locationEditor.draftPoint}
            center={center}
            handleMapPointSelect={locationEditor.handleMapPointSelect}
            detectedCity={locationEditor.detectedCity}
            confirmPoint={locationEditor.confirmPoint}
          />
        )}

        <EventImageFields
          images={allImages}
          error={errors.image}
          onChoose={chooseImage}
          onRemove={removeImage}
        />

        <EventDetailsFields
          formData={formData}
          errors={errors}
          setField={setField}
          isOnline={isOnline}
          publicPlaceConfirmed={publicPlaceConfirmed}
          setPublicPlaceConfirmed={setPublicPlaceConfirmed}
          submitting={submitting}
          isEdit={isEdit}
        />
      </form>
    </div>
  );
};

export default CreateEventForm;
