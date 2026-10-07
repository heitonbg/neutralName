import { describe, expect, it } from "vitest";
import {
  buildEventPayload,
  formatEventDuration,
  parseEventDuration,
  splitEventDateTime,
  validateEventForm,
} from "./eventFormModel.js";

const validOfflineForm = {
  title: "Вечер настольных игр",
  category: "Настольные игры",
  date: "2099-06-15",
  time: "18:30",
  durationHours: "2",
  durationMinutes: "0",
  format: "Офлайн",
  address: "Казань, улица Баумана",
  lat: 55.79,
  lng: 49.1,
  limit: "20",
  price: "Бесплатно",
  priceAmount: "",
  description: "Встречаемся и играем в настольные игры.",
  images: [],
};

describe("validateEventForm", () => {
  it("returns no errors for a valid offline event", () => {
    expect(validateEventForm(validOfflineForm, true)).toEqual({});
  });

  it("requires the core fields, a map point, and public-place confirmation", () => {
    const errors = validateEventForm(
      {
        ...validOfflineForm,
        title: "",
        category: "",
        date: "",
        time: "",
        address: "",
        lat: null,
        lng: null,
      },
      false,
    );

    expect(errors).toMatchObject({
      title: "Введите название",
      category: "Выберите категорию",
      date: "Укажите дату",
      time: "Укажите время",
      address: "Укажите место",
      publicPlace: "Подтвердите, что встреча проходит в общественном месте",
    });
  });

  describe("event form model helpers", () => {
    it("splits event dates using startAt and falls back to the legacy date field", () => {
      expect(
        splitEventDateTime({
          startAt: "2099-06-15T18:30:00",
          date: "old value",
        }),
      ).toEqual({ date: "2099-06-15", time: "18:30" });
      expect(splitEventDateTime({ date: "2099-06-15, 18:30" })).toEqual({
        date: "2099-06-15",
        time: "18:30",
      });
    });

    it("parses and formats numeric and localized durations", () => {
      expect(parseEventDuration(125)).toEqual({ hours: "2", minutes: "5" });
      expect(parseEventDuration("2 ч 5 мин")).toEqual({
        hours: "2",
        minutes: "5",
      });
      expect(formatEventDuration("2", "5")).toBe("2 ч 5 мин");
    });

    it("builds an offline event payload while preserving edit metadata", () => {
      const initialEvent = { participants: 7, rating: 4.8, reviewsCount: 12 };
      const payload = buildEventPayload({
        formData: {
          ...validOfflineForm,
          price: "Платно",
          priceAmount: "500",
        },
        images: ["https://example.test/event.jpg"],
        userId: 42,
        userName: "Алексей",
        userPhotoUrl: "https://example.test/user.jpg",
        userAge: 30,
        userCity: "Казань",
        userAbout: "Организатор",
        defaultCity: "Москва",
        initialEvent,
      });

      expect(payload).toMatchObject({
        priceAmount: 500,
        date: "2099-06-15, 18:30",
        startAt: new Date("2099-06-15T18:30").toISOString(),
        duration: "2 ч",
        address: validOfflineForm.address,
        district: validOfflineForm.address,
        city: "Москва",
        lat: 55.79,
        lng: 49.1,
        maxParticipants: 20,
        participants: 7,
        rating: 4.8,
        reviewsCount: 12,
        image: "https://example.test/event.jpg",
        images: ["https://example.test/event.jpg"],
        organizerId: "42",
        organizerProfile: {
          name: "Алексей",
          photo_url: "https://example.test/user.jpg",
          age: 30,
          city: "Казань",
          about: "Организатор",
        },
      });
    });

    it("clears location fields for online events and applies event defaults", () => {
      const payload = buildEventPayload({
        formData: {
          ...validOfflineForm,
          format: "Онлайн",
          limit: "",
          price: "Бесплатно",
          priceAmount: "",
        },
        images: [],
        userId: "user-id",
        userName: "",
        defaultCity: "Москва",
        initialEvent: null,
      });

      expect(payload).toMatchObject({
        priceAmount: null,
        address: "Онлайн",
        district: "Онлайн",
        city: null,
        lat: null,
        lng: null,
        maxParticipants: 50,
        participants: 1,
        organizerId: "user-id",
        organizerProfile: { name: "Вы", city: "Москва" },
      });
      expect(payload.image).toBeTruthy();
      expect(payload.images).toBeUndefined();
    });
  });

  it("rejects a past start time", () => {
    const errors = validateEventForm(
      { ...validOfflineForm, date: "2020-01-01", time: "12:00" },
      true,
    );

    expect(errors.date).toBe("Дата уже прошла");
  });

  it("validates duration, participant limit, and paid price", () => {
    const errors = validateEventForm(
      {
        ...validOfflineForm,
        durationHours: "73",
        durationMinutes: "60",
        limit: "1001",
        price: "Платно",
        priceAmount: "1.5",
      },
      true,
    );

    expect(errors).toMatchObject({
      duration: "Минуты: от 0 до 59",
      limit: "Максимум 1000 участников",
      priceAmount: "Укажите стоимость целым числом от 1 ₽",
    });
  });

  it("does not require an address or public-place confirmation for online events", () => {
    expect(
      validateEventForm(
        {
          ...validOfflineForm,
          format: "Онлайн",
          address: "",
          lat: null,
          lng: null,
        },
        false,
      ),
    ).toEqual({});
  });
});
