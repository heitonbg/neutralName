import { describe, expect, it } from "vitest";
import {
  createTouristPlan,
  formatOptionsCount,
  formatPlanSummary,
  mergeSavedRoute,
} from "./planModel.js";

describe("tourist plan model", () => {
  it("normalizes legacy saved event lists to a route option", () => {
    const plan = createTouristPlan({
      city: "Казань",
      events: [{ id: 12, title: "Встреча", date: "2026-10-06, 10:00" }],
    });

    expect(plan).toMatchObject({
      city: "Казань",
      selectedOptionId: "saved-route",
      options: [
        {
          id: "saved-route",
          events: [{ id: 12, title: "Встреча", date: "2026-10-06, 10:00" }],
        },
      ],
    });
  });

  it("preserves local custom stops and stop ordering while merging server saves", () => {
    const localPlan = {
      options: [
        {
          id: "day-1",
          events: [],
          places: [],
          stopOrder: ["custom-1"],
          customStops: [{ id: "custom-1", name: "Local stop" }],
        },
      ],
    };
    const saved = mergeSavedRoute(localPlan, {
      savedAt: "2026-01-01",
      options: [
        {
          id: "day-1",
          events: [],
          places: [],
          customStops: [{ id: "custom-1", address: "Казань" }],
        },
      ],
    });

    expect(saved.options[0].stopOrder).toEqual(["custom-1"]);
    expect(saved.options[0].customStops).toEqual([
      { id: "custom-1", name: "Local stop", address: "Казань" },
    ]);
  });

  it("formats Russian count forms for route and option summaries", () => {
    expect(formatPlanSummary([{}, {}, {}])).toBe("Маршрут: 3 события");
    expect(formatPlanSummary(Array.from({ length: 12 }, () => ({})))).toBe(
      "Маршрут: 12 событий",
    );
    expect(formatOptionsCount(2)).toBe("2 варианта поездки");
    expect(formatOptionsCount(21)).toBe("21 вариант поездки");
  });
});
