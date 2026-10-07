import { describe, expect, it } from "vitest";
import {
  findCityByName,
  findNearestCity,
  getAllCities,
  getCityCount,
  getTopCities,
  searchCities,
} from "./citySearch.js";

describe("citySearch", () => {
  it("loads the city directory and returns the top cities", () => {
    expect(getCityCount()).toBeGreaterThan(0);
    expect(getTopCities(5)).toHaveLength(5);
  });

  it("supports historical and partial city names", () => {
    expect(findCityByName("Казан")?.name).toBe("Казань");
    expect(searchCities("Казань")[0]?.name).toBe("Казань");
  });

  it("keeps the public city record shape after decoding the compact directory", () => {
    const moscow = findCityByName("Москва");

    expect(moscow).toMatchObject({
      name: "Москва",
      lat: 55.752,
      lng: 37.618,
      region: "48",
      regionName: expect.any(String),
      geonameid: 524901,
    });
    expect(getAllCities()).toHaveLength(getCityCount());
  });

  it("returns the nearest city for valid coordinates", () => {
    expect(findNearestCity(55.75, 37.62)?.city.name).toBe("Москва");
    expect(findNearestCity(Number.NaN, 37.62)).toBeNull();
  });
});
