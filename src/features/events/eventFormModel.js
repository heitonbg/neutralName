import { moderateContent, moderateUrl } from "../../utils/contentModeration.js";
import { getDefaultEventImage } from "../../utils/defaultEventImages.js";

export function splitEventDateTime(event) {
  if (!event) return { date: "", time: "" };

  if (event.startAt) {
    const startAt = new Date(event.startAt);
    if (!Number.isNaN(startAt.getTime())) {
      const pad = (value) => String(value).padStart(2, "0");
      return {
        date: `${startAt.getFullYear()}-${pad(startAt.getMonth() + 1)}-${pad(startAt.getDate())}`,
        time: `${pad(startAt.getHours())}:${pad(startAt.getMinutes())}`,
      };
    }
  }

  const dateString = String(event.date || "");
  const match = dateString.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T,\s]+(\d{1,2}:\d{2}))?/,
  );
  if (match) return { date: match[1], time: event.time || match[2] || "" };
  if (event.date && event.time) return { date: event.date, time: event.time };

  return { date: "", time: "" };
}

export function parseEventDuration(duration) {
  if (!duration) return { hours: "", minutes: "" };
  if (typeof duration === "number") {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return {
      hours: hours ? String(hours) : "",
      minutes: minutes ? String(minutes) : "",
    };
  }
  const value = String(duration);
  const hoursMatch = value.match(/(\d+)\s*ч/);
  const minutesMatch = value.match(/(\d+)\s*мин/);
  const onlyMinutes = /^\d+$/.test(value.trim()) ? parseInt(value, 10) : null;

  if (onlyMinutes !== null) {
    return {
      hours: Math.floor(onlyMinutes / 60) || "",
      minutes: onlyMinutes % 60 || "",
    };
  }
  return {
    hours: hoursMatch ? hoursMatch[1] : "",
    minutes: minutesMatch ? minutesMatch[1] : "",
  };
}

export function formatEventDuration(hours, minutes) {
  const parsedHours = parseInt(hours, 10) || 0;
  const parsedMinutes = parseInt(minutes, 10) || 0;
  if (!parsedHours && !parsedMinutes) return "";
  if (parsedHours && parsedMinutes) {
    return `${parsedHours} ч ${parsedMinutes} мин`;
  }
  if (parsedHours) return `${parsedHours} ч`;
  return `${parsedMinutes} мин`;
}

export function buildEventPayload({
  formData,
  images,
  userId,
  userName,
  userPhotoUrl,
  userAge,
  userCity,
  userAbout,
  defaultCity,
  initialEvent,
}) {
  const isOnline = formData.format === "Онлайн";
  const duration = formatEventDuration(
    formData.durationHours,
    formData.durationMinutes,
  );
  const startAt = new Date(`${formData.date}T${formData.time}`).toISOString();
  const organizerProfile = {
    name: userName || "Вы",
    photo_url: userPhotoUrl || undefined,
    age: userAge || undefined,
    city: userCity || formData.city || defaultCity,
    about: userAbout || undefined,
  };

  return {
    ...formData,
    priceAmount:
      formData.price === "Платно" ? Number(formData.priceAmount) : null,
    date: `${formData.date}, ${formData.time}`,
    startAt,
    duration,
    address: isOnline ? "Онлайн" : formData.address,
    district: isOnline ? "Онлайн" : formData.district || formData.address,
    city: isOnline ? null : formData.city || defaultCity,
    lat: isOnline ? null : formData.lat,
    lng: isOnline ? null : formData.lng,
    maxParticipants: Number.parseInt(formData.limit, 10) || 50,
    participants: initialEvent ? initialEvent.participants : 1,
    distance: "0 км",
    rating: initialEvent?.rating || 0,
    reviewsCount: initialEvent?.reviewsCount || 0,
    image: images[0] || getDefaultEventImage(formData.category),
    images: images.length ? images : undefined,
    organizerId: String(userId),
    organizerProfile,
  };
}

export function validateEventForm(
  formData,
  publicPlaceConfirmed,
  now = new Date(),
) {
  const errors = {};
  const titleCheck = moderateContent(formData.title);
  const descriptionCheck = moderateContent(formData.description);
  if (!titleCheck.isClean) errors.title = titleCheck.reason;
  if (!descriptionCheck.isClean) errors.description = descriptionCheck.reason;
  if (!formData.title.trim()) errors.title = "Введите название";
  if (!formData.category) errors.category = "Выберите категорию";
  if (!formData.date) errors.date = "Укажите дату";
  if (!formData.time) errors.time = "Укажите время";

  if (formData.date && formData.time) {
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    if (!Number.isNaN(dateTime.getTime()) && dateTime < now) {
      errors.date = "Дата уже прошла";
    }
  }

  const hours = parseInt(formData.durationHours, 10) || 0;
  const minutes = parseInt(formData.durationMinutes, 10) || 0;
  if (formData.durationHours && (hours < 0 || hours > 72)) {
    errors.duration = "Часы: от 0 до 72";
  }
  if (formData.durationMinutes && (minutes < 0 || minutes > 59)) {
    errors.duration = "Минуты: от 0 до 59";
  }
  if (
    (formData.durationHours || formData.durationMinutes) &&
    hours === 0 &&
    minutes === 0
  ) {
    errors.duration = "Укажите продолжительность больше 0";
  }

  if (formData.format === "Офлайн") {
    if (!formData.address.trim()) {
      errors.address = "Укажите место";
    } else if (
      formData.lat == null ||
      formData.lng == null ||
      !Number.isFinite(Number(formData.lat)) ||
      !Number.isFinite(Number(formData.lng)) ||
      Number(formData.lat) < -90 ||
      Number(formData.lat) > 90 ||
      Number(formData.lng) < -180 ||
      Number(formData.lng) > 180
    ) {
      errors.address = "Выберите найденный адрес или укажите точку на карте";
    }
  }

  if (formData.limit) {
    const limit = Number.parseInt(formData.limit, 10);
    if (!Number.isFinite(limit) || limit < 1)
      errors.limit = "Минимум 1 участник";
    if (limit > 1000) errors.limit = "Максимум 1000 участников";
  }

  if (formData.price === "Платно") {
    const priceAmount = Number(formData.priceAmount);
    if (
      !formData.priceAmount ||
      !Number.isInteger(priceAmount) ||
      priceAmount < 1
    ) {
      errors.priceAmount = "Укажите стоимость целым числом от 1 ₽";
    }
  }

  const firstUrlImage = formData.images.find(
    (image) => typeof image === "string" && !image.startsWith("data:"),
  );
  if (firstUrlImage) {
    const imageCheck = moderateUrl(firstUrlImage);
    if (!imageCheck.isClean) errors.image = imageCheck.reason;
  }

  if (formData.format !== "Онлайн" && !publicPlaceConfirmed) {
    errors.publicPlace =
      "Подтвердите, что встреча проходит в общественном месте";
  }

  return errors;
}
