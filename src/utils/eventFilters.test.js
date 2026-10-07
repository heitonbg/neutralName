import { describe, expect, it } from "vitest";
import {
  getEventStatus,
  matchesConfiguredFilters,
  parseEventEnd,
  parseEventStart,
} from "./eventFilters.js";

describe("eventFilters", () => {
  it("parses canonical startAt values", () => {
    const event = { startAt: "2026-10-06T10:00:00.000Z" };

    expect(parseEventStart(event)?.toISOString()).toBe(
      "2026-10-06T10:00:00.000Z",
    );
  });

  it("rejects impossible calendar dates instead of normalizing them", () => {
    expect(parseEventStart({ date: "2026-02-30 12:00" })).toBeNull();
  });

  it("uses the configured duration when calculating the end time", () => {
    const event = {
      startAt: "2026-10-06T10:00:00.000Z",
      duration: "1 ч 30 мин",
    };

    expect(parseEventEnd(event)?.toISOString()).toBe(
      "2026-10-06T11:30:00.000Z",
    );
  });

  it("changes an event from live to past at its end boundary", () => {
    const event = {
      startAt: "2026-10-06T10:00:00.000Z",
      duration: "60",
    };

    expect(getEventStatus(event, new Date("2026-10-06T10:59:59.999Z"))).toBe(
      "live",
    );
    expect(getEventStatus(event, new Date("2026-10-06T11:00:00.000Z"))).toBe(
      "past",
    );
  });

  it("filters events by price and format", () => {
    const event = { price: "Бесплатно", format: "Онлайн" };

    expect(
      matchesConfiguredFilters(
        event,
        { price: "Бесплатно", format: "Онлайн" },
        null,
      ),
    ).toBe(true);
    expect(
      matchesConfiguredFilters(
        event,
        { price: "Платно", format: "Онлайн" },
        null,
      ),
    ).toBe(false);
  });
});
