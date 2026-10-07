import { describe, expect, it } from "vitest";
import { formatEventDate } from "./dateFormat.js";

describe("formatEventDate", () => {
  it("formats an event on the current day with its time", () => {
    const now = new Date(2026, 9, 6, 9, 0);

    expect(formatEventDate({ date: "2026-10-06 18:30" }, now)).toBe(
      "Сегодня, 18:30",
    );
  });

  it("labels an event as completed after its duration has elapsed", () => {
    const event = {
      startAt: "2026-10-06T10:00:00.000Z",
      date: "2026-10-06 10:00",
      duration: "60",
    };

    expect(formatEventDate(event, new Date("2026-10-06T11:00:00.000Z"))).toBe(
      "Завершено",
    );
  });
});
